import { NextResponse } from "next/server"
import { z } from "zod"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server-client"
import { ensureUserProfile } from "@/lib/auth"
import { canManageProjects } from "@/lib/permissions"
import { updateProjectTask, deleteProjectTask } from "@/lib/data"

const taskUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["nao_iniciada", "em_andamento", "concluida"]).optional(),
  responsibleEmail: z.string().email().or(z.literal("")).optional(),
})

function extractTaskId(url: string, paramsId?: string) {
  if (paramsId) return paramsId
  const segments = new URL(url).pathname.split("/").filter(Boolean)
  return segments.length ? segments[segments.length - 1] : undefined
}

export async function PUT(request: Request, { params }: { params: { taskId?: string } }) {
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

    const taskId = extractTaskId(request.url, params.taskId)
    if (!taskId) {
      return NextResponse.json({ error: "Tarefa nao informada." }, { status: 400 })
    }

    const payload = await request.json()
    const data = taskUpdateSchema.parse(payload)

    const task = await updateProjectTask(taskId, {
      ...data,
      responsibleEmail: data.responsibleEmail || undefined,
    })

    return NextResponse.json({ task })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error("[PROJECT_TASK_UPDATE]", error)
    return NextResponse.json({ error: "Falha ao atualizar tarefa." }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { taskId?: string } }) {
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

    const taskId = extractTaskId(request.url, params.taskId)
    if (!taskId) {
      return NextResponse.json({ error: "Tarefa nao informada." }, { status: 400 })
    }

    await deleteProjectTask(taskId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PROJECT_TASK_DELETE]", error)
    return NextResponse.json({ error: "Falha ao remover tarefa." }, { status: 500 })
  }
}
