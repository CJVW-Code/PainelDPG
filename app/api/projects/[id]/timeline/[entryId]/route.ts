import { NextResponse } from "next/server"
import { z } from "zod"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server-client"
import { ensureUserProfile } from "@/lib/auth"
import { canManageProjects } from "@/lib/permissions"
import { updateTimelineEntry, deleteTimelineEntry } from "@/lib/data"

const timelineSchema = z.object({
  label: z.string().min(3).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(["marco", "tarefa", "fase"]).optional(),
  taskId: z.string().uuid().nullable().optional(),
})

export async function PUT(request: Request, { params }: { params: { entryId: string } }) {
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

    const payload = await request.json()
    const data = timelineSchema.parse(payload)
    const entry = await updateTimelineEntry(params.entryId, data)
    return NextResponse.json({ entry })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error("[PROJECT_TIMELINE_ENTRY][PUT]", error)
    return NextResponse.json({ error: "Falha ao atualizar evento." }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { entryId: string } }) {
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

    await deleteTimelineEntry(params.entryId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PROJECT_TIMELINE_ENTRY][DELETE]", error)
    return NextResponse.json({ error: "Falha ao remover evento." }, { status: 500 })
  }
}
