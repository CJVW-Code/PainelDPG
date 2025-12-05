"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Pause,
  AlertTriangle,
  HelpCircle,
  Pencil,
  Trash2,
  Paperclip,
  FileText,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"

import type {
  CommentAttachment,
  Project,
  ProjectTask,
  ProjectComment,
  ProjectTimelineEntry,
  ProjectTaskStatus,
  User,
} from "@/lib/types"
import { AREAS, STATUS_INFO } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
  canEdit?: boolean
  onEdit?: (project: Project) => void
  currentUser?: User | null
  onProjectUpdated?: () => void
  onOpenTimeline?: (project: Project) => void
}

const statusIcons = {
  planejado: HelpCircle,
  em_andamento: Clock,
  pausado: Pause,
  concluido: CheckCircle2,
  atrasado: AlertTriangle,
  pendente: AlertCircle,
}

const TASK_STATUS_OPTIONS: { value: ProjectTaskStatus; label: string }[] = [
  { value: "nao_iniciada", label: "Não iniciada" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
]

const TIMELINE_TYPE_OPTIONS = [
  { value: "marco", label: "Marco" },
  { value: "tarefa", label: "Tarefa" },
  { value: "fase", label: "Fase" },
]

const timelineTypeStyles: Record<
  ProjectTimelineEntry["type"],
  { bg: string; border: string; color: string; label: string }
> = {
  marco: { bg: "bg-emerald-50", border: "border-emerald-200", color: "text-emerald-700", label: "Marco" },
  tarefa: { bg: "bg-sky-50", border: "border-sky-200", color: "text-sky-700", label: "Tarefa" },
  fase: { bg: "bg-amber-50", border: "border-amber-200", color: "text-amber-700", label: "Fase" },
}

const detectMimeType = (file: File) => {
  if (file.type) return file.type
  if (file.name.toLowerCase().endsWith(".pdf")) return "application/pdf"
  return "application/octet-stream"
}

const isAllowedAttachment = (mimeType: string) => mimeType.startsWith("image/") || mimeType === "application/pdf"

export function ProjectModal({
  project,
  onClose,
  canEdit,
  onEdit,
  currentUser,
  onProjectUpdated,
  onOpenTimeline,
}: ProjectModalProps) {
  const initialTaskFormState = {
    title: "",
    description: "",
    status: "nao_iniciada" as ProjectTaskStatus,
    responsibleEmail: "",
    startDate: "",
    dueDate: "",
  }
  const initialTimelineFormState = {
    label: "",
    description: "",
    type: "marco",
    startDate: "",
    endDate: "",
  }

  const [tasks, setTasks] = useState<ProjectTask[]>(project?.tasks ?? [])
  const [comments, setComments] = useState<ProjectComment[]>(project?.comments ?? [])
  const [timelineEntries, setTimelineEntries] = useState<ProjectTimelineEntry[]>(project?.timeline ?? [])
  const [taskForm, setTaskForm] = useState(initialTaskFormState)
  const [isSavingTask, setIsSavingTask] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commentFiles, setCommentFiles] = useState<CommentAttachment[]>([])
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [timelineForm, setTimelineForm] = useState(initialTimelineFormState)
  const [isSavingTimeline, setIsSavingTimeline] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setTasks(project?.tasks ?? [])
    setComments(project?.comments ?? [])
    setTimelineEntries(project?.timeline ?? [])
  }, [project])

  const progressValue = useMemo(() => {
    if (!project) return 0
    if (!tasks.length) return project.progress
    const done = tasks.filter((task) => task.status === "concluida").length
    return Math.round((done / tasks.length) * 100)
  }, [project, tasks])

  const projectStartDate = project?.startDate
  const projectEndDate = project?.endDate

  const projectTimelineMonths = useMemo(() => {
    if (!projectStartDate || !projectEndDate || !timelineEntries.length) return []
    const startMil = Math.min(
      new Date(projectStartDate).getTime(),
      ...timelineEntries.map((entry) => new Date(entry.startDate).getTime()),
    )
    const endMil = Math.max(
      new Date(projectEndDate).getTime(),
      ...timelineEntries.map((entry) => new Date(entry.endDate).getTime()),
    )

    const startDate = new Date(new Date(startMil).getFullYear(), new Date(startMil).getMonth(), 1)
    const endDate = new Date(new Date(endMil).getFullYear(), new Date(endMil).getMonth(), 1)
    const months: Date[] = []
    const cursor = new Date(startDate)
    while (cursor <= endDate) {
      months.push(new Date(cursor))
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return months
  }, [timelineEntries, projectStartDate, projectEndDate])

  const getTimelinePosition = useCallback(
    (entry: ProjectTimelineEntry) => {
      if (!projectTimelineMonths.length) {
        return { start: 0, duration: 1 }
      }
      const first = projectTimelineMonths[0]
      const entryStart = new Date(entry.startDate)
      const entryEnd = new Date(entry.endDate)
      const startDiff = (entryStart.getFullYear() - first.getFullYear()) * 12 + (entryStart.getMonth() - first.getMonth())
      const duration =
        (entryEnd.getFullYear() - entryStart.getFullYear()) * 12 + (entryEnd.getMonth() - entryStart.getMonth()) + 1
      return { start: startDiff, duration }
    },
    [projectTimelineMonths],
  )

  if (!project) {
    return null
  }

  const area = AREAS[project.area]
  const status = STATUS_INFO[project.status]
  const StatusIcon = statusIcons[project.status]

  const backgroundFile = project.files?.find((file) => file.category === "background")
  const highlightFiles = project.files?.filter((file) => file.category === "destaque") ?? []
  const evidenceFiles = project.files?.filter((file) => file.category === "comprovacao") ?? []
  const generalFiles = project.files?.filter((file) => file.category === "anexo") ?? []
  const PROJECT_TIMELINE_MONTH_WIDTH = 80

  const uploadFileToStorage = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const uploadResponse = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    })

    if (!uploadResponse.ok) {
      const payload = await uploadResponse.json().catch(() => ({}))
      throw new Error(payload.error ?? `Falha ao enviar ${file.name}.`)
    }

    const { url } = (await uploadResponse.json()) as { url: string }
    return url
  }

  const handleTaskSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!project) return
    setIsSavingTask(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskForm,
          responsibleEmail: taskForm.responsibleEmail || undefined,
          startDate: taskForm.startDate || undefined,
          dueDate: taskForm.dueDate || undefined,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? "Falha ao adicionar tarefa.")
      }

      const payload = (await response.json()) as { task: ProjectTask }
      setTasks((prev) => [...prev, payload.task])
      setTaskForm(initialTaskFormState)
      toast.success("Tarefa criada.")
      onProjectUpdated?.()
    } catch (error) {
      console.error("[TASK_CREATE]", error)
      toast.error(error instanceof Error ? error.message : "Falha ao criar tarefa.")
    } finally {
      setIsSavingTask(false)
    }
  }

  const handleTaskStatusChange = async (task: ProjectTask, status: ProjectTaskStatus) => {
    if (!project) return
    try {
      const response = await fetch(`/api/projects/${project.id}/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? "Falha ao atualizar tarefa.")
      }
      const payload = (await response.json()) as { task: ProjectTask }
      setTasks((prev) => prev.map((item) => (item.id === task.id ? payload.task : item)))
      onProjectUpdated?.()
    } catch (error) {
      console.error("[TASK_UPDATE]", error)
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar tarefa.")
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    if (!project) return
    try {
      const response = await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? "Falha ao remover tarefa.")
      }
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      toast.success("Tarefa removida.")
      onProjectUpdated?.()
    } catch (error) {
      console.error("[TASK_DELETE]", error)
      toast.error(error instanceof Error ? error.message : "Falha ao remover tarefa.")
    }
  }

  const handleTimelineSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!project) return
    setIsSavingTimeline(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...timelineForm,
          startDate: timelineForm.startDate,
          endDate: timelineForm.endDate,
        }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? "Falha ao criar evento.")
      }
      const payload = (await response.json()) as { entry: ProjectTimelineEntry }
      setTimelineEntries((prev) => [...prev, payload.entry])
      setTimelineForm(initialTimelineFormState)
      toast.success("Evento adicionado.")
      onProjectUpdated?.()
    } catch (error) {
      console.error("[TIMELINE_CREATE]", error)
      toast.error(error instanceof Error ? error.message : "Falha ao criar evento.")
    } finally {
      setIsSavingTimeline(false)
    }
  }

  const handleTimelineDelete = async (entryId: string) => {
    if (!project) return
    try {
      const response = await fetch(`/api/projects/${project.id}/timeline/${entryId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? "Falha ao remover evento.")
      }
      setTimelineEntries((prev) => prev.filter((entry) => entry.id !== entryId))
      toast.success("Evento removido.")
      onProjectUpdated?.()
    } catch (error) {
      console.error("[TIMELINE_DELETE]", error)
      toast.error(error instanceof Error ? error.message : "Falha ao remover evento.")
    }
  }

  const handleDeleteProject = async () => {
    if (!project) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? "Falha ao excluir projeto.")
      }
      toast.success("Projeto excluído.")
      onClose()
      onProjectUpdated?.()
    } catch (error) {
      console.error("[PROJECT_DELETE]", error)
      toast.error(error instanceof Error ? error.message : "Falha ao excluir projeto.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCommentFiles = async (fileList: FileList | null) => {
    if (!fileList) return
    const uploads: CommentAttachment[] = []
    try {
      for (const file of Array.from(fileList)) {
        const mimeType = detectMimeType(file)
        if (!isAllowedAttachment(mimeType)) {
          toast.error(`Arquivo "${file.name}" não é suportado.`)
          continue
        }
        const url = await uploadFileToStorage(file)
        uploads.push({
          name: file.name,
          mimeType,
          url,
        })
      }
      if (uploads.length) {
        setCommentFiles((prev) => [...prev, ...uploads])
      }
    } catch (error) {
      console.error("[COMMENT_UPLOAD]", error)
      toast.error(error instanceof Error ? error.message : "Falha ao enviar arquivo para comentário.")
    }
  }

  const handleCommentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!project) return
    setIsSavingComment(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText,
          attachments: commentFiles,
        }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? "Falha ao enviar comentário.")
      }
      const payload = (await response.json()) as { comment: ProjectComment }
      setComments((prev) => [payload.comment, ...prev])
      setCommentText("")
      setCommentFiles([])
      toast.success("Comentário enviado.")
      onProjectUpdated?.()
    } catch (error) {
      console.error("[COMMENT_CREATE]", error)
      toast.error(error instanceof Error ? error.message : "Falha ao enviar comentário.")
    } finally {
      setIsSavingComment(false)
    }
  }

  const handleCommentDelete = async (commentId: string) => {
    if (!project) return
    try {
      const response = await fetch(`/api/projects/${project.id}/comments/${commentId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? "Falha ao remover comentário.")
      }
      setComments((prev) => prev.filter((comment) => comment.id !== commentId))
      toast.success("Comentário removido.")
      onProjectUpdated?.()
    } catch (error) {
      console.error("[COMMENT_DELETE]", error)
      toast.error(error instanceof Error ? error.message : "Falha ao remover comentário.")
    }
  }

  return (
    <AnimatePresence>
      {project && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-foreground/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal - Using semantic colors throughout */}
          <motion.div
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[85vh] bg-card rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className={`p-6 ${area.bgColor} border-b border-border`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bgColor} ${status.color} flex items-center gap-1.5`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                    <span className={`text-xs font-medium ${area.color}`}>{area.name}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-card-foreground">{project.name}</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-card/50 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Descrição</h3>
                <p className="text-card-foreground leading-relaxed">{project.description}</p>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Progresso</h3>
                  <span className="text-lg font-bold text-card-foreground">{progressValue}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      progressValue === 100
                        ? "bg-success"
                        : project.status === "atrasado"
                            ? "bg-destructive"
                          : "bg-primary-light"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressValue}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Início</span>
                  </div>
                  <p className="text-card-foreground font-semibold">
                    {new Date(project.startDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Previsão de Término</span>
                  </div>
                  <p className="text-card-foreground font-semibold">
                    {new Date(project.endDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Team */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Equipe ({project.team.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {project.team.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-primary-muted flex items-center justify-center text-primary font-semibold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(backgroundFile || highlightFiles.length || evidenceFiles.length || generalFiles.length) && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Arquivos</h3>
                  </div>
                  <div className="space-y-4">
                    {backgroundFile && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Imagem de fundo</p>
                        <a
                          href={backgroundFile.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 text-sm font-medium text-primary"
                        >
                          <ImageIcon className="h-4 w-4" />
                          {backgroundFile.name}
                        </a>
                      </div>
                    )}
                    {highlightFiles.length > 0 && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Imagens de destaque</p>
                        <div className="space-y-2">
                          {highlightFiles.map((file) => (
                            <a
                              key={file.id ?? file.url}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 text-sm text-card-foreground hover:text-primary transition-colors"
                            >
                              <ImageIcon className="h-4 w-4 text-primary" />
                              <span>{file.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {evidenceFiles.length > 0 && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Comprovações</p>
                        <div className="space-y-2">
                          {evidenceFiles.map((file) => {
                            const isImage = file.mimeType.startsWith("image/")
                            return (
                              <a
                                key={file.id ?? file.url}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 text-sm text-card-foreground hover:text-primary transition-colors"
                              >
                                {isImage ? (
                                  <ImageIcon className="h-4 w-4 text-primary" />
                                ) : (
                                  <FileText className="h-4 w-4 text-primary" />
                                )}
                                <span>{file.name}</span>
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {generalFiles.length > 0 && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Arquivos adicionais</p>
                        <div className="space-y-2">
                          {generalFiles.map((file) => {
                            const isImage = file.mimeType.startsWith("image/")
                            return (
                              <a
                                key={file.id ?? file.url}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 text-sm text-card-foreground hover:text-primary transition-colors"
                              >
                                {isImage ? (
                                  <ImageIcon className="h-4 w-4 text-primary" />
                                ) : (
                                  <FileText className="h-4 w-4 text-primary" />
                                )}
                                <span>{file.name}</span>
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Checklist</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tasks.filter((task) => task.status === "concluida").length} de {tasks.length} tarefas concluídas
                  </p>
                </div>
                <div className="space-y-2">
                  {tasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa cadastrada.</p>}
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-card-foreground">{task.title}</p>
                          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleTaskStatusChange(task, value as ProjectTaskStatus)}
                            disabled={!canEdit}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TASK_STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {canEdit && (
                            <Button variant="ghost" size="icon" onClick={() => handleTaskDelete(task.id)} aria-label="Remover tarefa">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {task.responsible && <span>Responsável: {task.responsible.name}</span>}
                        {task.startDate && <span>Início: {new Date(task.startDate).toLocaleDateString("pt-BR")}</span>}
                        {task.dueDate && <span>Término: {new Date(task.dueDate).toLocaleDateString("pt-BR")}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {canEdit && (
                  <form className="mt-4 grid gap-3 rounded-lg border p-4" onSubmit={handleTaskSubmit}>
                    <Label className="text-sm font-semibold">Adicionar nova tarefa</Label>
                    <Input
                      placeholder="Título"
                      value={taskForm.title}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                      required
                    />
                    <Textarea
                      placeholder="Descrição"
                      value={taskForm.description}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        type="date"
                        value={taskForm.startDate}
                        onChange={(event) => setTaskForm((prev) => ({ ...prev, startDate: event.target.value }))}
                      />
                      <Input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        type="email"
                        placeholder="E-mail do responsável"
                        value={taskForm.responsibleEmail}
                        onChange={(event) => setTaskForm((prev) => ({ ...prev, responsibleEmail: event.target.value }))}
                      />
                      <Select
                        value={taskForm.status}
                        onValueChange={(value) => setTaskForm((prev) => ({ ...prev, status: value as ProjectTaskStatus }))}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={isSavingTask}>
                      {isSavingTask ? "Salvando..." : "Adicionar tarefa"}
                    </Button>
                  </form>
                )}
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Timeline</h3>
                </div>
                <div className="space-y-2">
                  {timelineEntries.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum evento cadastrado na timeline.</p>
                  )}
                  {timelineEntries.map((entry) => (
                    <div key={entry.id} className="rounded-lg border p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-card-foreground">{entry.label}</p>
                          <p className="text-xs text-muted-foreground capitalize">{entry.type}</p>
                        </div>
                        {canEdit && (
                          <Button variant="ghost" size="icon" aria-label="Remover evento" onClick={() => handleTimelineDelete(entry.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {entry.description && <p className="text-sm text-muted-foreground">{entry.description}</p>}
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.startDate).toLocaleDateString("pt-BR")} -{" "}
                        {new Date(entry.endDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
                {canEdit && (
                  <form className="mt-4 grid gap-3 rounded-lg border p-4" onSubmit={handleTimelineSubmit}>
                    <Label className="text-sm font-semibold">Adicionar evento</Label>
                    <Input
                      placeholder="Título do marco"
                      value={timelineForm.label}
                      onChange={(event) => setTimelineForm((prev) => ({ ...prev, label: event.target.value }))}
                      required
                    />
                    <Textarea
                      placeholder="Descrição"
                      value={timelineForm.description}
                      onChange={(event) => setTimelineForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        type="date"
                        value={timelineForm.startDate}
                        onChange={(event) => setTimelineForm((prev) => ({ ...prev, startDate: event.target.value }))}
                        required
                      />
                      <Input
                        type="date"
                        value={timelineForm.endDate}
                        onChange={(event) => setTimelineForm((prev) => ({ ...prev, endDate: event.target.value }))}
                        required
                      />
                    </div>
                    <Select value={timelineForm.type} onValueChange={(value) => setTimelineForm((prev) => ({ ...prev, type: value }))}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMELINE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="submit" disabled={isSavingTimeline}>
                      {isSavingTimeline ? "Salvando..." : "Adicionar evento"}
                    </Button>
                  </form>
                )}
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Timeline do Projeto</h3>
                  {timelineEntries.length > 0 && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {Object.entries(timelineTypeStyles).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1">
                          <span className={`w-3 h-3 rounded-full ${value.bg} border ${value.border}`} />
                          <span>{value.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {timelineEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum marco cadastrado ainda. Utilize a aba de Timeline para registrar eventos importantes.
                  </p>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <div className="min-w-max p-4">
                      <div className="flex border-b border-border pb-2 mb-4">
                        <div className="w-40 shrink-0" />
                        {projectTimelineMonths.map((month, index) => (
                          <div key={index} className="w-20 shrink-0 text-center text-xs font-medium text-muted-foreground">
                            {month.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        {timelineEntries.map((entry) => {
                          const { start, duration } = getTimelinePosition(entry)
                          const styles = timelineTypeStyles[entry.type]
                          return (
                            <div key={entry.id} className="flex items-center">
                              <div className="w-40 shrink-0 pr-4">
                                <p className="text-sm font-semibold text-card-foreground">{entry.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(entry.startDate).toLocaleDateString("pt-BR")} -{" "}
                                  {new Date(entry.endDate).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                              <div className="flex-1 relative h-12">
                                {projectTimelineMonths.map((_, i) => (
                                  <div key={i} className="w-20 shrink-0 h-full border-l border-border/40 inline-block" />
                                ))}
                                <div
                                  className={`absolute top-1 h-8 rounded border ${styles.border} ${styles.bg} flex items-center px-2`}
                                  style={{
                                    left: `${start * PROJECT_TIMELINE_MONTH_WIDTH}px`,
                                    width: `${duration * PROJECT_TIMELINE_MONTH_WIDTH - 6}px`,
                                  }}
                                >
                                  <span className={`text-xs font-medium ${styles.color}`}>{styles.label}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Comentários</h3>
                </div>
                <div className="space-y-3">
                  {comments.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há comentários.</p>}
                  {comments.map((comment) => {
                    const canRemove = canEdit || (currentUser && currentUser.id === comment.author.id)
                    return (
                      <div key={comment.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-card-foreground">{comment.author.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString("pt-BR")}
                            </p>
                          </div>
                          {canRemove && (
                            <Button variant="ghost" size="icon" onClick={() => handleCommentDelete(comment.id)} aria-label="Remover comentário">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-card-foreground">{comment.content}</p>
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-3 text-xs text-primary">
                            {comment.attachments.map((file, index) => (
                              <a key={`${comment.id}-${index}`} href={file.url} target="_blank" rel="noreferrer">
                                {file.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <form className="mt-4 grid gap-3 rounded-lg border p-4" onSubmit={handleCommentSubmit}>
                  <Label className="text-sm font-semibold">Novo comentário</Label>
                  <Textarea
                    placeholder="Escreva seu comentário"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    required
                  />
                  <Input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(event) => {
                      handleCommentFiles(event.target.files)
                      if (event.target.value) {
                        event.target.value = ""
                      }
                    }}
                  />
                  {commentFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {commentFiles.map((file, index) => (
                        <span key={`${file.url}-${index}`} className="px-2 py-1 bg-muted rounded-full">
                          {file.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <Button type="submit" disabled={isSavingComment || !commentText.trim()}>
                    {isSavingComment ? "Enviando..." : "Enviar comentário"}
                  </Button>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span
                  className={`text-sm font-medium ${
                    project.priority === "alta"
                      ? "text-destructive"
                      : project.priority === "media"
                          ? "text-warning"
                          : "text-muted-foreground"
                  }`}
                >
                  Prioridade: {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {canEdit && (
                    <>
                      {onOpenTimeline && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            onClose()
                            onOpenTimeline(project)
                          }}
                        >
                          <Calendar className="h-4 w-4" />
                          Ver timeline
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-2" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4" />
                            {isDeleting ? "Excluindo..." : "Excluir"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação é permanente e removerá o projeto e todos os registros associados. Deseja continuar?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={isDeleting}
                              onClick={(event) => {
                                event.preventDefault()
                                handleDeleteProject()
                              }}
                            >
                              Confirmar exclusão
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (project) {
                            onEdit?.(project)
                          }
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                    </>
                  )}
                  <Button size="sm" onClick={onClose} className="bg-primary text-primary-foreground hover:bg-primary-hover">
                    Fechar
                  </Button>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
