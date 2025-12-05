"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { RadarView } from "@/components/radar/radar-view"
import { BentoGrid } from "@/components/projetos/bento-grid"
import { CreateProjectDialog } from "@/components/projetos/create-project-dialog"
import { ProjectModal } from "@/components/projetos/project-modal"
import { TimelineView } from "@/components/timeline/timeline-view"
import { PresentationMode, PresentationModeButton } from "@/components/presentation-mode"
import { UserMenu } from "@/components/auth/user-menu"
import { useProjects } from "@/hooks/use-projects"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { Project, AreaInteresse } from "@/lib/types"

type View = "radar" | "grid"
type GridView = "grid" | "timeline"

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<View>("radar")
  const [gridView, setGridView] = useState<GridView>("grid")
  const [selectedArea, setSelectedArea] = useState<AreaInteresse | "all">("all")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [presentationMode, setPresentationMode] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const { projects, isLoading, error, refetch } = useProjects(selectedArea)
  const { user: currentUser } = useCurrentUser()
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const canEditProjects = useMemo(() => {
    if (!currentUser?.roles) return false
    return currentUser.roles.some(
      (role) => role.name.toLowerCase().includes("coordenador") || role.name.toLowerCase() === "admin" || role.level >= 60,
    )
  }, [currentUser])

  const handleAreaClick = (area: AreaInteresse | "all") => {
    setSelectedArea(area)
    setCurrentView("grid")
  }

  const handleBack = () => {
    setCurrentView("radar")
    setGridView("grid")
  }

  const handleProjectClick = (project: Project) => {
    setSelectedProjectId(project.id)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="flex justify-end px-4 sm:px-6 py-4">
        <UserMenu />
      </div>
      <AnimatePresence mode="wait">
        {currentView === "radar" ? (
          <motion.div key="radar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RadarView onAreaClick={handleAreaClick} />
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {gridView === "grid" ? (
              <>
                {error && <p className="text-center text-destructive mb-4">{error}</p>}
                {isLoading ? (
                  <div className="py-24 text-center text-muted-foreground">Carregando projetos...</div>
                ) : (
                  <BentoGrid
                    projects={projects}
                    initialArea={selectedArea}
                    onBack={handleBack}
                    onProjectClick={handleProjectClick}
                    onViewChange={setGridView}
                    currentView={gridView}
                    onProjectCreated={refetch}
                    currentUser={currentUser}
                  />
                )}
              </>
            ) : (
              <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 lg:p-12">
                <div className="max-w-7xl mx-auto">
                  <div className="flex flex-wrap items-center gap-4 mb-8">
                    <button onClick={handleBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-[200px]">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Linha do Tempo</h1>
                      <p className="text-muted-foreground text-sm">Visualização cronológica dos projetos</p>
                    </div>

                    <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2 p-1 bg-muted rounded-lg">
                      <button
                        onClick={() => setGridView("grid")}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => setGridView("timeline")}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-card text-card-foreground shadow-sm"
                      >
                        Timeline
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-destructive mb-4">{error}</p>}
                  {isLoading ? (
                    <div className="py-16 text-center text-muted-foreground">Carregando timeline...</div>
                  ) : (
                    <TimelineView projects={projects} onProjectClick={handleProjectClick} />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Modal */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProjectId(null)}
        canEdit={canEditProjects}
        onEdit={(project) => {
          setProjectToEdit(project)
          setSelectedProjectId(null)
        }}
      />

      {projectToEdit && currentUser && (
        <CreateProjectDialog
          mode="edit"
          project={projectToEdit}
          currentUser={currentUser}
          hideTrigger
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setProjectToEdit(null)
            }
          }}
          onCreated={() => {
            setProjectToEdit(null)
            refetch()
          }}
        />
      )}

      {/* Presentation Mode - Now receives filtered projects based on selected area */}
      <AnimatePresence>
        {presentationMode && (
          <PresentationMode projects={projects} isActive={presentationMode} onClose={() => setPresentationMode(false)} />
        )}
      </AnimatePresence>

      {/* Presentation Mode Button */}
      {!presentationMode && currentView === "grid" && (
        <PresentationModeButton onClick={() => setPresentationMode(true)} />
      )}
    </main>
  )
}
