import { NextResponse } from "next/server"
import { z } from "zod"

import { updateProject } from "@/lib/data"
import { createProjectSchema } from "@/lib/validations/project"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server-client"
import { ensureUserProfile } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const coordinatorRoleNames = ["coordenador", "coordenadora"]

async function userCanEdit(userId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })

  if (!profile) return false

  return profile.roles.some(
    ({ role }) =>
      coordinatorRoleNames.includes(role.name.toLowerCase()) ||
      role.name.toLowerCase() === "admin" ||
      role.level >= 60,
  )
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    await ensureUserProfile(user)

    const canEdit = await userCanEdit(user.id)

    if (!canEdit) {
      return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 })
    }

    const payload = await request.json()
    const data = createProjectSchema.parse(payload)
    const project = await updateProject(params.id, {
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
