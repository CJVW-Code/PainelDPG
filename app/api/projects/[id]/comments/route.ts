import { NextResponse } from "next/server"
import { z } from "zod"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server-client"
import { ensureUserProfile } from "@/lib/auth"
import { canManageProjects } from "@/lib/permissions"
import { createProjectComment, getProjectComments } from "@/lib/data"

const attachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().min(1),
})

const commentSchema = z.object({
  content: z.string().min(3, "Informe um comentario."),
  attachments: z.array(attachmentSchema).optional(),
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
    const comments = await getProjectComments(projectId)
    return NextResponse.json({ comments })
  } catch (error) {
    console.error("[PROJECT_COMMENTS][GET]", error)
    return NextResponse.json({ error: "Falha ao carregar comentarios." }, { status: 500 })
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

    const profile = await ensureUserProfile(user)

    const canEdit = await canManageProjects(user.id)
    if (!canEdit) {
      return NextResponse.json({ error: "Permissao insuficiente." }, { status: 403 })
    }

    const projectId = extractProjectId(request.url, params.id)
    if (!projectId) {
      return NextResponse.json({ error: "Projeto nao informado." }, { status: 400 })
    }

    const payload = await request.json()
    const data = commentSchema.parse(payload)

    const comment = await createProjectComment(projectId, profile.id, data)
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error("[PROJECT_COMMENTS][POST]", error)
    return NextResponse.json({ error: "Falha ao criar comentario." }, { status: 500 })
  }
}
