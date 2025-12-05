import { NextResponse } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server-client"
import { ensureUserProfile } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    const profile = await ensureUserProfile(user)
    const dbUser = await prisma.user.findUnique({
      where: { id: profile.id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!dbUser) {
      return NextResponse.json({ user: null })
    }

    const roles = dbUser.roles.map(({ role }) => ({
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      level: role.level,
    }))

    return NextResponse.json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        avatar: dbUser.avatar ?? undefined,
        roles,
      },
    })
  } catch (error) {
    console.error("[ME_API]", error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
