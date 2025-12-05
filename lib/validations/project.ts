import { z } from "zod"

export const areaValues = ["transparencia", "inovacao", "eficiencia", "dialogo", "all"] as const
export const statusValues = ["planejado", "em_andamento", "pausado", "concluido", "atrasado", "pendente"] as const
export const priorityValues = ["baixa", "media", "alta"] as const
export const visibilityValues = ["public", "restricted"] as const
export const fileCategoryValues = ["anexo", "comprovacao", "destaque", "background"] as const

export const createProjectSchema = z
  .object({
    name: z.string().min(3, "Informe um nome com pelo menos 3 caracteres."),
    description: z.string().min(10, "Descrição precisa ter no mínimo 10 caracteres."),
    area: z.enum(areaValues),
    status: z.enum(statusValues),
    priority: z.enum(priorityValues),
    startDate: z.string().min(1, "Informe a data inicial."),
    endDate: z.string().min(1, "Informe a data final."),
    visibility: z.enum(visibilityValues),
    featured: z.boolean().optional(),
    imagePosition: z.enum(["top", "center", "bottom"]).optional(),
    image: z
      .string()
      .url("Informe uma URL válida.")
      .optional(),
    files: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          name: z.string().min(1, "Informe o nome do arquivo."),
          url: z.string().url("Informe uma URL válida."),
          mimeType: z.string().min(1, "Informe o tipo do arquivo."),
          category: z.enum(fileCategoryValues).default("anexo"),
          position: z.enum(["top", "center", "bottom"]).optional(),
        }),
      )
      .optional(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "Data final deve ser maior ou igual à inicial.",
    path: ["endDate"],
  })

export type CreateProjectSchema = z.infer<typeof createProjectSchema>
