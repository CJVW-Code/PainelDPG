import type { User as SupabaseUser } from "@supabase/supabase-js"

import { prisma } from "@/lib/prisma"

export async function ensureUserProfile(user: SupabaseUser) {
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.email?.split("@")[0] ?? "Usuário")
  const avatar = (user.user_metadata?.avatar_url as string | undefined) ?? undefined

  return prisma.user.upsert({
    where: { id: user.id },
    update: {
      name,
      email: user.email ?? "",
      avatar: avatar ?? null,
    },
    create: {
      id: user.id,
      name,
      email: user.email ?? "",
      avatar: avatar ?? null,
    },
  })
}
