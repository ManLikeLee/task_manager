-- Add username to users (with safe backfill for existing rows)
ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User"
SET "username" = COALESCE(
  NULLIF(TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(SPLIT_PART("email", '@', 1), '[^a-z0-9_-]+', '-', 'g'))), ''),
  'user'
);

WITH ranked AS (
  SELECT
    "id",
    "username",
    ROW_NUMBER() OVER (PARTITION BY "username" ORDER BY "createdAt" ASC, "id" ASC) AS rn
  FROM "User"
)
UPDATE "User" AS u
SET "username" = CASE
  WHEN ranked.rn = 1 THEN ranked."username"
  ELSE LEFT(
    ranked."username",
    GREATEST(1, 30 - LENGTH('-' || (ranked.rn - 1)::text))
  ) || '-' || (ranked.rn - 1)::text
END
FROM ranked
WHERE ranked."id" = u."id";

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Track team creator for ownership/audit
ALTER TABLE "Team" ADD COLUMN "createdById" TEXT;

UPDATE "Team" t
SET "createdById" = w."ownerId"
FROM "Workspace" w
WHERE w."id" = t."workspaceId";

ALTER TABLE "Team" ALTER COLUMN "createdById" SET NOT NULL;
CREATE INDEX "Team_createdById_idx" ON "Team"("createdById");
ALTER TABLE "Team" ADD CONSTRAINT "Team_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Workspace invite codes for onboarding join flow
CREATE TABLE "WorkspaceInvite" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "roleToAssign" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceInvite_code_key" ON "WorkspaceInvite"("code");
CREATE INDEX "WorkspaceInvite_workspaceId_idx" ON "WorkspaceInvite"("workspaceId");
CREATE INDEX "WorkspaceInvite_code_idx" ON "WorkspaceInvite"("code");

ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
