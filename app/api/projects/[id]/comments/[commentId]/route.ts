import { NextResponse } from "next/server"
import { z } from "zod"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server-client"
import { ensureUserProfile } from "@/lib/auth"
import { canManageProjects } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { updateProjectComment, deleteProjectComment } from "@/lib/data"

const attachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().min(1),
})

const commentSchema = z.object({
  content: z.string().min(3),
  attachments: z.array(attachmentSchema).optional(),
})

async function canModifyComment(userId: string, commentId: string) {
  const comment = await prisma.projectComment.findUnique({
    where: { id: commentId },
    include: {
      project: true,
    },
  })
  if (!comment) return false
  if (comment.authorId === userId) return true
  if (comment.project.createdById === userId) return true
  return canManageProjects(userId)
}

export async function PUT(request: Request, { params }: { params: { commentId: string } }) {
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

    const allowed = await canModifyComment(user.id, params.commentId)
    if (!allowed) {
      return NextResponse.json({ error: "Permissão insuficiente." }, { status: 403 })
    }

    const payload = await request.json()
    const data = commentSchema.parse(payload)
    const comment = await updateProjectComment(params.commentId, data)
    return NextResponse.json({ comment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error("[PROJECT_COMMENT][PUT]", error)
    return NextResponse.json({ error: "Falha ao atualizar comentário." }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { commentId: string } }) {
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
    const allowed = await canModifyComment(user.id, params.commentId)

    if (!allowed) {
      return NextResponse.json({ error: "Permissão insuficiente." }, { status: 403 })
    }

    await deleteProjectComment(params.commentId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PROJECT_COMMENT][DELETE]", error)
    return NextResponse.json({ error: "Falha ao remover comentário." }, { status: 500 })
  }
}
