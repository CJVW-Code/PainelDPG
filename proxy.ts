import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

export default async function proxy(req: NextRequest) {
  const response = NextResponse.next()

  const isProtectedApi = req.nextUrl.pathname.startsWith("/api/projects") || req.nextUrl.pathname.startsWith("/api/uploads")

  if (isProtectedApi) {
    const supabase = (await import("@supabase/auth-helpers-nextjs")).createMiddlewareClient({
      req,
      res: response,
    })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
  }

  return response
}
