CREATE TABLE "Project" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "progress" INTEGER NOT NULL,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  "priority" TEXT NOT NULL,
  "featured" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "TeamMember" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "avatar" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ProjectMember" (
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "teamMemberId" TEXT NOT NULL REFERENCES "TeamMember"("id") ON DELETE CASCADE,
  PRIMARY KEY ("projectId", "teamMemberId")
);
