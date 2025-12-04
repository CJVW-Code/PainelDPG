"use client"

import { useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { LogOut } from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import { Button } from "@/components/ui/button"

export function UserMenu() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  if (!user) return null

  return (
    <div className="flex items-center gap-3 rounded-full border px-4 py-2 bg-background/80 backdrop-blur">
      <div className="text-left">
        <p className="text-sm font-semibold">{user.email}</p>
        <p className="text-xs text-muted-foreground">Sessão ativa</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="gap-2"
        onClick={async () => {
          await supabase.auth.signOut()
          window.location.href = "/login"
        }}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </div>
  )
}
