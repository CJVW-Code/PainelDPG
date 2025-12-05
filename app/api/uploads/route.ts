import { Buffer } from "node:buffer"
import { NextResponse } from "next/server"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server-client"

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "projects"

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[UPLOAD_API] bucket", BUCKET)
    console.log("[UPLOAD_API] user", user?.id)

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 })
    }

    const normalizedType =
      file.type ||
      (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : file.type || "application/octet-stream")

    if (!normalizedType.startsWith("image/") && normalizedType !== "application/pdf") {
      return NextResponse.json({ error: "Apenas imagens ou PDFs são permitidos." }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filePath = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`

    const { data, error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
      contentType: normalizedType,
      upsert: false,
    })

    if (error || !data) {
      console.error("[UPLOAD_API]", error)
      return NextResponse.json({ error: "Falha ao enviar arquivo." }, { status: 500 })
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)

    return NextResponse.json({ url: publicData.publicUrl })
  } catch (error) {
    console.error("[UPLOAD_API]", error)
    return NextResponse.json({ error: "Erro inesperado ao enviar arquivo." }, { status: 500 })
  }
}
