import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { updateProject, deleteProject } from "@/lib/data"
import { createProjectSchema } from "@/lib/validations/project"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server-client"
import { ensureUserProfile } from "@/lib/auth"
import { canManageProjects } from "@/lib/permissions"

export async function PUT(request: Request, context: { params: { id?: string } }) {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }

    await ensureUserProfile(user)

    const canEdit = await canManageProjects(user.id)

    if (!canEdit) {
      return NextResponse.json({ error: "Permissao insuficiente" }, { status: 403 })
    }

    const projectId = context.params?.id ?? new URL(request.url).pathname.split("/").filter(Boolean).pop()

    if (!projectId) {
      return NextResponse.json({ error: "Projeto nao informado" }, { status: 400 })
    }

    const payload = await request.json()
    const data = createProjectSchema.parse(payload)
    const project = await updateProject(projectId, {
      ...data,
      image: data.image || undefined,
      files: data.files ?? [],
    })

    return NextResponse.json({ project })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error("[PROJECT_UPDATE]", error)
      return NextResponse.json({ error: "Falha ao atualizar projeto" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: { id?: string } }) {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }

    await ensureUserProfile(user)

    const canEdit = await canManageProjects(user.id)

    if (!canEdit) {
      return NextResponse.json({ error: "Permissao insuficiente" }, { status: 403 })
    }

    const projectId = context.params?.id ?? new URL(request.url).pathname.split("/").filter(Boolean).pop()

    if (!projectId) {
      return NextResponse.json({ error: "Projeto nao informado" }, { status: 400 })
    }

    await deleteProject(projectId)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Projeto nao encontrado" }, { status: 404 })
    }
    console.error("[PROJECT_DELETE]", error)
    return NextResponse.json({ error: "Falha ao excluir projeto" }, { status: 500 })
  }
}
