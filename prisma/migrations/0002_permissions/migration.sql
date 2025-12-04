CREATE TYPE "ProjectVisibility" AS ENUM ('PUBLIC', 'RESTRICTED');

ALTER TABLE "Project" ADD COLUMN "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PUBLIC';

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "avatar" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Role" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "level" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "UserRole" (
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "roleId" TEXT NOT NULL REFERENCES "Role"("id") ON DELETE CASCADE,
  "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("userId", "roleId")
);

CREATE TABLE "ProjectAccessRule" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "roleId" TEXT REFERENCES "Role"("id") ON DELETE CASCADE,
  "canView" BOOLEAN NOT NULL DEFAULT TRUE,
  "canEdit" BOOLEAN NOT NULL DEFAULT FALSE,
  "canManage" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "ProjectAccessRule_projectId_idx" ON "ProjectAccessRule" ("projectId");
CREATE INDEX "ProjectAccessRule_userId_idx" ON "ProjectAccessRule" ("userId");
CREATE INDEX "ProjectAccessRule_roleId_idx" ON "ProjectAccessRule" ("roleId");

INSERT INTO "Role" ("id", "name", "description", "level")
VALUES
  (gen_random_uuid(), 'admin', 'Acesso completo a todos os projetos', 100),
  (gen_random_uuid(), 'gestor', 'Pode editar projetos atribuídos', 60),
  (gen_random_uuid(), 'viewer', 'Pode visualizar projetos permitidos', 10)
ON CONFLICT ("name") DO NOTHING;
