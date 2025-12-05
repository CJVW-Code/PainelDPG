"use client"

import { cloneElement, isValidElement, useEffect, useMemo, useState } from "react"
import type { ReactElement } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Pencil, Trash2, FileText, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

import {
  createProjectSchema,
  areaValues,
  priorityValues,
  statusValues,
  visibilityValues,
  CreateProjectSchema,
} from "@/lib/validations/project"
import type { AreaInteresse, Project, ProjectFile, ProjectFileCategory, User } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

 type FormValues = CreateProjectSchema

type AttachmentFormItem = {
  id?: string
  name: string
  mimeType: string
  url?: string
  file?: File
  category: ProjectFileCategory
  position?: "top" | "center" | "bottom"
}

interface CreateProjectDialogProps {
  defaultArea?: AreaInteresse | "all"
  onCreated?: () => void
  currentUser?: User | null
  mode?: "create" | "edit"
  project?: Project
  trigger?: React.ReactNode
  hideTrigger?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function projectFileToAttachment(file: ProjectFile): AttachmentFormItem {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    url: file.url,
    category: file.category ?? "anexo",
    position: file.position ?? "center",
  }
}

const detectMimeType = (file: File) => {
  if (file.type) return file.type
  if (file.name.toLowerCase().endsWith(".pdf")) return "application/pdf"
  return "application/octet-stream"
}

const isAllowedAttachment = (mimeType: string) => mimeType.startsWith("image/") || mimeType === "application/pdf"

export function CreateProjectDialog({
  defaultArea = "all",
  onCreated,
  currentUser,
  mode = "create",
  project,
  trigger,
  hideTrigger,
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<AttachmentFormItem[]>([])
  const [loginHref, setLoginHref] = useState("/login")
  const isEditMode = mode === "edit" && Boolean(project)
  const dialogOpen = typeof open === "boolean" ? open : internalOpen

  useEffect(() => {
    if (typeof window !== "undefined") {
      const redirectTo = encodeURIComponent(window.location.pathname + window.location.search)
      setLoginHref(`/login?redirectTo=${redirectTo}`)
    }
  }, [])

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: isEditMode && project ? project.name : "",
      description: isEditMode && project ? project.description : "",
      area: isEditMode && project ? project.area : defaultArea !== "all" ? defaultArea : "transparencia",
      status: isEditMode && project ? project.status : "planejado",
      priority: isEditMode && project ? project.priority : "media",
      startDate: isEditMode && project ? project.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      endDate:
        isEditMode && project
          ? project.endDate.slice(0, 10)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      visibility: isEditMode && project ? project.visibility ?? "public" : "public",
      featured: isEditMode && project ? Boolean(project.featured) : false,
      image: isEditMode && project ? project.image : undefined,
      imagePosition: isEditMode && project && project.imagePosition ? project.imagePosition : "center",
    }),
    [defaultArea, isEditMode, project],
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isEditMode && project) {
      form.reset(defaultValues)
      setPreviewUrl(project.image ?? null)
    }
  }, [defaultValues, form, isEditMode, project])

  useEffect(() => {
    if (!isEditMode && defaultArea && defaultArea !== "all") {
      form.setValue("area", defaultArea)
    }
  }, [defaultArea, form, isEditMode])

  useEffect(() => {
    if (!dialogOpen) {
      setImageFile(null)
      if (previewUrl && imageFile) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(isEditMode && project?.image ? project.image : null)
      setAttachments([])
      return
    }
    if (isEditMode && project?.files) {
      setAttachments(project.files.map(projectFileToAttachment))
    }
  }, [dialogOpen, imageFile, previewUrl, isEditMode, project])

  useEffect(() => {
    return () => {
      if (imageFile && previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [imageFile, previewUrl])

  const selectedArea = form.watch("area")
  const backgroundFiles = attachments.filter((file) => file.category === "background")
  const highlightFiles = attachments.filter((file) => file.category === "destaque")
  const evidenceFiles = attachments.filter((file) => file.category === "comprovacao")
  const generalFiles = attachments.filter((file) => file.category === "anexo")

  const headerSubtitle = useMemo(() => {
    if (isEditMode && project) return `Editando ${project.name}`
    if (selectedArea === "all") return "Novo projeto"
    return `Novo projeto para ${selectedArea}`
  }, [isEditMode, project, selectedArea])

  const headerTitle = isEditMode ? "Editar projeto" : "Adicionar novo projeto"

  const handleOpenChange = (next: boolean) => {
    if (typeof open !== "boolean") {
      setInternalOpen(next)
    }
    onOpenChange?.(next)
    if (!next) {
      form.reset(defaultValues)
    }
  }

  const handleTriggerClick = () => {
    if (!currentUser) {
      toast.info(isEditMode ? "Faca login para editar projetos." : "Faca login para criar projetos.")
      window.location.href = loginHref
      return
    }

    if (!isEditMode || project) {
      handleOpenChange(true)
    }
  }

  const renderTrigger = () => {
    if (hideTrigger) return null

    const defaultButton = (
      <Button className="gap-2" onClick={handleTriggerClick}>
        {isEditMode ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {isEditMode ? "Editar projeto" : "Novo Projeto"}
      </Button>
    )

    if (trigger && isValidElement(trigger)) {
      const element = trigger as ReactElement<{ onClick?: React.MouseEventHandler }>
      return cloneElement(element, {
        onClick: (event: React.MouseEvent) => {
          element.props?.onClick?.(event)
          if (!event.defaultPrevented) {
            handleTriggerClick()
          }
        },
      })
    }

    return defaultButton
  }

  const handleAttachmentSelection = (
    fileList: FileList | null,
    category: ProjectFileCategory,
    options?: { replace?: boolean },
  ) => {
    if (!fileList) return
    const incoming: AttachmentFormItem[] = []
    Array.from(fileList).forEach((file) => {
      const mimeType = detectMimeType(file)
      if (!isAllowedAttachment(mimeType)) {
        toast.error(`Arquivo "${file.name}" nao e suportado. Envie imagens ou PDFs.`)
        return
      }
      incoming.push({
        name: file.name,
        mimeType,
        file,
        category,
        position: "center",
      })
    })
    if (incoming.length) {
      setAttachments((prev) => {
        const filtered = options?.replace ? prev.filter((item) => item.category !== category) : prev
        return [...filtered, ...incoming]
      })
    }
  }

  const removeAttachment = (target: AttachmentFormItem) => {
    setAttachments((prev) => prev.filter((item) => item !== target))
  }

  const updateAttachmentPosition = (target: AttachmentFormItem, position: "top" | "center" | "bottom") => {
    setAttachments((prev) =>
      prev.map((item) => {
        if (item !== target) return item
        return {
          ...item,
          position,
        }
      }),
    )
  }

  const renderPositionSelector = (attachment: AttachmentFormItem) => {
    if (!attachment.mimeType?.toLowerCase().startsWith("image/")) {
      return null
    }

    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Enquadramento:</span>
        <Select
          value={attachment.position ?? "center"}
          onValueChange={(value) => updateAttachmentPosition(attachment, value as "top" | "center" | "bottom")}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Topo</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="bottom">Base</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  }

  const uploadFileToStorage = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const uploadResponse = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    })

    if (!uploadResponse.ok) {
      const payload = await uploadResponse.json().catch(() => ({} as { error?: string }))
      const message = payload.error ?? `Falha ao enviar ${file.name}.`

      if (uploadResponse.status === 401 || message.toLowerCase().includes("nao autenticado")) {
        toast.info("Sua sessao expirou. Faca login novamente para continuar.")
        window.location.href = loginHref
        throw new Error("Nao autenticado")
      }

      throw new Error(message)
    }

    const { url } = (await uploadResponse.json()) as { url: string }
    return url
  }

  async function onSubmit(values: FormValues) {
    try {
      let uploadedImageUrl = values.image

      if (imageFile) {
        uploadedImageUrl = await uploadFileToStorage(imageFile)
      }

      const attachmentPayload = []
      for (const attachment of attachments) {
        if (attachment.file) {
          const url = await uploadFileToStorage(attachment.file)
          attachmentPayload.push({
            name: attachment.name,
            mimeType: attachment.mimeType || detectMimeType(attachment.file),
            url,
            category: attachment.category,
            position: attachment.position ?? "center",
          })
        } else if (attachment.url) {
          attachmentPayload.push({
            id: attachment.id,
            name: attachment.name,
            mimeType: attachment.mimeType,
            url: attachment.url,
            category: attachment.category,
            position: attachment.position ?? "center",
          })
        }
      }

      const endpoint = isEditMode && project ? `/api/projects/${project.id}` : "/api/projects"
      const method = isEditMode && project ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          image: uploadedImageUrl,
          files: attachmentPayload,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({} as { error?: string }))
        const message = payload.error ?? `Falha ao ${isEditMode ? "atualizar" : "criar"} projeto.`

        if (response.status === 401 || message.toLowerCase().includes("nao autenticado")) {
          toast.info("Sua sessao expirou. Faca login novamente para continuar.")
          window.location.href = loginHref
          throw new Error("Nao autenticado")
        }

        throw new Error(message)
      }

      toast.success(isEditMode ? "Projeto atualizado com sucesso!" : "Projeto criado com sucesso!")
      handleOpenChange(false)
      onCreated?.()
      setAttachments([])
      setImageFile(null)
      setPreviewUrl(null)
    } catch (error) {
      console.error("[CreateProjectDialog]", error)
      toast.error(
        error instanceof Error
          ? error.message
          : `Erro inesperado ao ${isEditMode ? "atualizar" : "criar"} projeto.`,
      )
    }
  }

  return (
    <>
      {renderTrigger()}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{headerTitle}</DialogTitle>
            <DialogDescription>{headerSubtitle}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Portal do Assistido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a area" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {areaValues.map((area) => (
                            <SelectItem key={area} value={area}>
                              {area.charAt(0).toUpperCase() + area.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descricao</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Descreva o objetivo do projeto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusValues.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityValues.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibilidade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {visibilityValues.map((visibility) => (
                            <SelectItem key={visibility} value={visibility}>
                              {visibility === "public" ? "Publico" : "Restrito"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inicio</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Termino</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <Label>Imagem do projeto (opcional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) {
                      if (previewUrl && !isEditMode) URL.revokeObjectURL(previewUrl)
                      setImageFile(null)
                      setPreviewUrl(isEditMode && project?.image ? project.image : null)
                      return
                    }
                    if (previewUrl && !isEditMode) {
                      URL.revokeObjectURL(previewUrl)
                    }
                    setImageFile(file)
                    setPreviewUrl(URL.createObjectURL(file))
                  }}
                />
                {previewUrl && (
                  <div className="rounded-lg border p-2">
                    <p className="text-xs text-muted-foreground mb-2">Pre-visualizacao</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Pre-visualizacao" className="w-full h-40 object-cover rounded-md" />
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="imagePosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posicao da imagem</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? "center"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Centralizada" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="top">Topo</SelectItem>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="bottom">Base</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <p className="text-xs text-muted-foreground">Formatos suportados: JPG, PNG, WEBP. Tamanho max. 5MB.</p>
              </div>

              <div className="space-y-3">
                <Label>Imagem de fundo do projeto</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    handleAttachmentSelection(event.target.files, "background", { replace: true })
                    if (event.target.value) {
                      event.target.value = ""
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Essa imagem sera usada como plano de fundo na pagina do projeto.</p>
                {backgroundFiles.length > 0 && (
                  <div className="space-y-2">
                    {backgroundFiles.map((attachment, index) => (
                      <div
                        key={attachment.id ?? attachment.url ?? `${attachment.name}-background-${index}`}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">{attachment.mimeType}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttachment(attachment)}
                            aria-label="Remover imagem de fundo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {renderPositionSelector(attachment)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Imagens de destaque</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) => {
                    handleAttachmentSelection(event.target.files, "destaque")
                    if (event.target.value) {
                      event.target.value = ""
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Utilize imagens que reforcem a apresentacao do projeto.</p>
                {highlightFiles.length > 0 && (
                  <div className="space-y-2">
                    {highlightFiles.map((attachment, index) => (
                      <div
                        key={attachment.id ?? attachment.url ?? `${attachment.name}-highlight-${index}`}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 pr-2">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium line-clamp-1">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">{attachment.mimeType}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttachment(attachment)}
                            aria-label={`Remover ${attachment.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {renderPositionSelector(attachment)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Comprovacoes (PDF ou imagens)</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(event) => {
                    handleAttachmentSelection(event.target.files, "comprovacao")
                    if (event.target.value) {
                      event.target.value = ""
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Envie documentos em PDF ou imagens que comprovem a execucao.</p>
                {evidenceFiles.length > 0 && (
                  <div className="space-y-2">
                    {evidenceFiles.map((attachment, index) => (
                      <div
                        key={attachment.id ?? attachment.url ?? `${attachment.name}-evidence-${index}`}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 pr-2">
                            {attachment.mimeType.startsWith("image/") ? (
                              <ImageIcon className="h-4 w-4 text-primary" />
                            ) : (
                              <FileText className="h-4 w-4 text-primary" />
                            )}
                            <div>
                              <p className="text-sm font-medium line-clamp-1">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">{attachment.mimeType}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttachment(attachment)}
                            aria-label={`Remover ${attachment.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {renderPositionSelector(attachment)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Arquivos adicionais (PDF ou imagens)</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(event) => {
                    handleAttachmentSelection(event.target.files, "anexo")
                    if (event.target.value) {
                      event.target.value = ""
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Arquivos gerais que voce queira anexar ao projeto.</p>
                {generalFiles.length > 0 && (
                  <div className="space-y-2">
                    {generalFiles.map((attachment, index) => (
                      <div
                        key={attachment.id ?? attachment.url ?? `${attachment.name}-extra-${index}`}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 pr-2">
                            {attachment.mimeType.startsWith("image/") ? (
                              <ImageIcon className="h-4 w-4 text-primary" />
                            ) : (
                              <FileText className="h-4 w-4 text-primary" />
                            )}
                            <div>
                              <p className="text-sm font-medium line-clamp-1">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">{attachment.mimeType}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttachment(attachment)}
                            aria-label={`Remover ${attachment.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {renderPositionSelector(attachment)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="font-medium">Destacar no grid</p>
                  <p className="text-sm text-muted-foreground">O projeto aparecera com card ampliado.</p>
                </div>
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Salvando..." : "Salvar projeto"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
