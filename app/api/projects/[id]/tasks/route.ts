import { NextResponse } from "next/server"
import { z } from "zod"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server-client"
import { ensureUserProfile } from "@/lib/auth"
import { canManageProjects } from "@/lib/permissions"
import { createProjectTask, getProjectTasks } from "@/lib/data"

const taskPayloadSchema = z.object({
  title: z.string().min(3, "Informe um titulo com pelo menos 3 caracteres."),
  description: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["nao_iniciada", "em_andamento", "concluida"]).optional(),
  responsibleEmail: z.string().email().optional(),
})

function extractProjectId(url: string, paramsId?: string) {
  if (paramsId) return paramsId
  const segments = new URL(url).pathname.split("/").filter(Boolean)
  return segments.length >= 2 ? segments[segments.length - 2] : undefined
}

export async function GET(request: Request, { params }: { params: { id?: string } }) {
  try {
    const projectId = extractProjectId(request.url, params.id)
    if (!projectId) {
      return NextResponse.json({ error: "Projeto nao informado." }, { status: 400 })
    }
    const tasks = await getProjectTasks(projectId)
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("[PROJECT_TASKS][GET]", error)
    return NextResponse.json({ error: "Falha ao carregar tarefas." }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id?: string } }) {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 })
    }

    await ensureUserProfile(user)

    const canEdit = await canManageProjects(user.id)
    if (!canEdit) {
      return NextResponse.json({ error: "Permissao insuficiente." }, { status: 403 })
    }

    const projectId = extractProjectId(request.url, params.id)
    if (!projectId) {
      return NextResponse.json({ error: "Projeto nao informado." }, { status: 400 })
    }

    const payload = await request.json()
    const data = taskPayloadSchema.parse(payload)

    const task = await createProjectTask(projectId, {
      ...data,
      startDate: data.startDate || undefined,
      dueDate: data.dueDate || undefined,
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error("[PROJECT_TASKS][POST]", error)
    return NextResponse.json({ error: "Falha ao criar tarefa." }, { status: 500 })
  }
}
