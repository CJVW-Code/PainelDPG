import { NextResponse } from "next/server"
import { z } from "zod"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server-client"
import { ensureUserProfile } from "@/lib/auth"
import { canManageProjects } from "@/lib/permissions"
import { createTimelineEntry, getTimelineEntries } from "@/lib/data"

const timelineSchema = z.object({
  label: z.string().min(3, "Informe um título."),
  description: z.string().optional(),
  startDate: z.string().min(1, "Informe a data inicial."),
  endDate: z.string().min(1, "Informe a data final."),
  type: z.enum(["marco", "tarefa", "fase"]).default("marco"),
  taskId: z.string().uuid().optional(),
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
    const entries = await getTimelineEntries(projectId)
    return NextResponse.json({ entries })
  } catch (error) {
    console.error("[PROJECT_TIMELINE][GET]", error)
    return NextResponse.json({ error: "Falha ao carregar timeline." }, { status: 500 })
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
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }

    await ensureUserProfile(user)

    const canEdit = await canManageProjects(user.id)
    if (!canEdit) {
      return NextResponse.json({ error: "Permissão insuficiente." }, { status: 403 })
    }

    const projectId = extractProjectId(request.url, params.id)
    if (!projectId) {
      return NextResponse.json({ error: "Projeto nao informado." }, { status: 400 })
    }

    const payload = await request.json()
    const data = timelineSchema.parse(payload)

    const entry = await createTimelineEntry(projectId, data)
    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error("[PROJECT_TIMELINE][POST]", error)
    return NextResponse.json({ error: "Falha ao criar evento na timeline." }, { status: 500 })
  }
}
