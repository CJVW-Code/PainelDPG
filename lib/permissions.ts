import { prisma } from "@/lib/prisma"

const coordinatorRoleNames = ["coordenador", "coordenadora"]

export async function canManageProjects(userId: string) {
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

  return profile.roles.some(({ role }) => {
    const name = role.name.toLowerCase()
    return coordinatorRoleNames.includes(name) || name === "admin" || role.level >= 60
  })
}
