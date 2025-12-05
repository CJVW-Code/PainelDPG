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

    if (authError || !user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo invalido." }, { status: 400 })
    }

    const normalizedType =
      file.type ||
      (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : file.type || "application/octet-stream")

    if (!normalizedType.startsWith("image/") && normalizedType !== "application/pdf") {
      return NextResponse.json({ error: "Apenas imagens ou PDFs sao permitidos." }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const sanitizedName = file.name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.-]/g, "-")
      .replace(/-+/g, "-")
    const filePath = `${user.id}/${Date.now()}-${sanitizedName}`

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
