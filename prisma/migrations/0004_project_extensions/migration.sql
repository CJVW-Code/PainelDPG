-- Enums for tasks, timeline, and file categories
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectTaskStatus') THEN
    CREATE TYPE "ProjectTaskStatus" AS ENUM ('NAO_INICIADA', 'EM_ANDAMENTO', 'CONCLUIDA');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectTimelineType') THEN
    CREATE TYPE "ProjectTimelineType" AS ENUM ('MARCO', 'TAREFA', 'FASE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectFileCategory') THEN
    CREATE TYPE "ProjectFileCategory" AS ENUM ('BACKGROUND', 'DESTAQUE', 'COMPROVACAO', 'ANEXO');
  END IF;
END $$;

-- ProjectTask table
CREATE TABLE IF NOT EXISTS public."ProjectTask" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" uuid NOT NULL REFERENCES public."Project"(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status "ProjectTaskStatus" NOT NULL DEFAULT 'NAO_INICIADA',
  "responsibleId" uuid REFERENCES public."User"(id) ON DELETE SET NULL,
  "startDate" timestamptz,
  "dueDate" timestamptz,
  "completedAt" timestamptz,
  "order" int NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projecttask_project_status
  ON public."ProjectTask"("projectId", status);

-- ProjectComment table
CREATE TABLE IF NOT EXISTS public."ProjectComment" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" uuid NOT NULL REFERENCES public."Project"(id) ON DELETE CASCADE,
  "authorId" uuid NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachments jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projectcomment_projectid
  ON public."ProjectComment"("projectId");

-- ProjectTimelineEntry table
CREATE TABLE IF NOT EXISTS public."ProjectTimelineEntry" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" uuid NOT NULL REFERENCES public."Project"(id) ON DELETE CASCADE,
  "taskId" uuid REFERENCES public."ProjectTask"(id) ON DELETE SET NULL,
  type "ProjectTimelineType" NOT NULL DEFAULT 'MARCO',
  label text NOT NULL,
  description text,
  "startDate" timestamptz NOT NULL,
  "endDate" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projecttimeline_projectid
  ON public."ProjectTimelineEntry"("projectId");

CREATE INDEX IF NOT EXISTS idx_projecttimeline_taskid
  ON public."ProjectTimelineEntry"("taskId");

-- ProjectFile category column
ALTER TABLE public."ProjectFile"
  ADD COLUMN IF NOT EXISTS category "ProjectFileCategory" NOT NULL DEFAULT 'ANEXO';

-- Trigger function to keep updatedAt fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_projecttask_updated_at'
  ) THEN
    CREATE TRIGGER set_projecttask_updated_at
    BEFORE UPDATE ON public."ProjectTask"
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_projectcomment_updated_at'
  ) THEN
    CREATE TRIGGER set_projectcomment_updated_at
    BEFORE UPDATE ON public."ProjectComment"
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_projecttimeline_updated_at'
  ) THEN
    CREATE TRIGGER set_projecttimeline_updated_at
    BEFORE UPDATE ON public."ProjectTimelineEntry"
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;
END $$;
