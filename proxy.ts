import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { createSupabaseMiddlewareClient } from "@/lib/supabase/server-client"

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

export default async function proxy(req: NextRequest) {
  const response = NextResponse.next()

  const isProjectsApi = req.nextUrl.pathname.startsWith("/api/projects")
  const isUploadsApi = req.nextUrl.pathname.startsWith("/api/uploads")
  const requiresAuth = (isProjectsApi && req.method !== "GET") || isUploadsApi

  if (requiresAuth) {
    const supabase = createSupabaseMiddlewareClient(req, response)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
  }

  return response
}
