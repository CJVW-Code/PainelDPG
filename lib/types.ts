export type ProjectStatus = "planejado" | "em_andamento" | "pausado" | "concluido" | "atrasado" | "pendente"

export type AreaInteresse = "civel" | "criminal" | "familia" | "administrativo" | "tecnologia"

export type ProjectVisibility = "public" | "restricted"

export interface TeamMember {
  id: string
  name: string
  role: string
  avatar?: string
}

export interface Project {
  id: string
  name: string
  description: string
  area: AreaInteresse
  status: ProjectStatus
  progress: number // 0-100
  startDate: string
  endDate: string
  team: TeamMember[]
  priority: "baixa" | "media" | "alta"
  featured?: boolean // Para cards maiores no Bento Grid
  image?: string // Added image field for card backgrounds
  visibility?: ProjectVisibility
  createdById?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  level: number
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  roles?: Role[]
}

export interface ProjectAccessRule {
  id: string
  projectId: string
  userId?: string
  roleId?: string
  canView: boolean
  canEdit: boolean
  canManage: boolean
}

export interface AreaInfo {
  id: AreaInteresse
  name: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
}

export const AREAS: Record<AreaInteresse, AreaInfo> = {
  civel: {
    id: "civel",
    name: "Cível",
    color: "text-primary-dark",
    bgColor: "bg-primary-subtle",
    borderColor: "border-primary",
    icon: "Scale",
  },
  criminal: {
    id: "criminal",
    name: "Criminal",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive",
    icon: "Gavel",
  },
  familia: {
    id: "familia",
    name: "Família",
    color: "text-primary",
    bgColor: "bg-primary-muted",
    borderColor: "border-primary-border-strong",
    icon: "Users",
  },
  administrativo: {
    id: "administrativo",
    name: "Administrativo",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning",
    icon: "Building2",
  },
  tecnologia: {
    id: "tecnologia",
    name: "Tecnologia",
    color: "text-primary-hover",
    bgColor: "bg-accent",
    borderColor: "border-primary-hover",
    icon: "Cpu",
  },
}

export const STATUS_INFO: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  planejado: { label: "Planejado", color: "text-muted-foreground", bgColor: "bg-muted" },
  em_andamento: { label: "Em Andamento", color: "text-primary", bgColor: "bg-primary-muted" },
  pausado: { label: "Pausado", color: "text-warning", bgColor: "bg-warning/10" },
  concluido: { label: "Concluído", color: "text-success", bgColor: "bg-primary-muted" },
  atrasado: { label: "Atrasado", color: "text-destructive", bgColor: "bg-destructive/10" },
  pendente: { label: "Pendente", color: "text-warning", bgColor: "bg-warning/10" },
}
