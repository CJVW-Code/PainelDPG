import { NextResponse } from "next/server"
import { z } from "zod"

import { createProject, getProjectById, getProjects, getProjectsByArea } from "@/lib/data"
import type { AreaInteresse } from "@/lib/types"
import { createProjectSchema } from "@/lib/validations/project"
import { ensureUserProfile } from "@/lib/auth"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server-client"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const area = searchParams.get("area")
  const supabase = await createSupabaseRouteHandlerClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const visibilityFilter = user ? undefined : "public"

    if (id) {
      const project = await getProjectById(id, visibilityFilter ? { visibility: visibilityFilter } : undefined)

      if (!project) {
        return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
      }

      return NextResponse.json({ project })
    }

    const projects =
      area && area !== "all"
        ? await getProjectsByArea(
            area as AreaInteresse,
            visibilityFilter ? { visibility: visibilityFilter } : undefined,
          )
        : await getProjects(visibilityFilter ? { visibility: visibilityFilter } : undefined)

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("[PROJECTS_API]", error)
    return NextResponse.json({ error: "Falha ao consultar projetos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const profile = await ensureUserProfile(user)
    const payload = await request.json()
    const data = createProjectSchema.parse(payload)

    const project = await createProject({
      ...data,
      image: data.image || undefined,
      imagePosition: data.imagePosition || undefined,
      createdById: profile.id,
      files: data.files ?? [],
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error("[PROJECTS_API][POST]", error)
    return NextResponse.json({ error: "Falha ao criar projeto" }, { status: 500 })
  }
}
