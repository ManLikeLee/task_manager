ALTER TABLE "Workspace" ADD COLUMN "joinCode" TEXT;

UPDATE "Workspace"
SET "joinCode" = 'TF-' || UPPER(SUBSTRING(MD5("id") FROM 1 FOR 5))
WHERE "joinCode" IS NULL;

WITH ranked AS (
  SELECT
    "id",
    "joinCode",
    ROW_NUMBER() OVER (PARTITION BY "joinCode" ORDER BY "createdAt" ASC, "id" ASC) AS rn
  FROM "Workspace"
)
UPDATE "Workspace" w
SET "joinCode" = CASE
  WHEN ranked.rn = 1 THEN ranked."joinCode"
  ELSE 'TF-' || UPPER(SUBSTRING(MD5(w."id" || ranked.rn::text) FROM 1 FOR 5))
END
FROM ranked
WHERE ranked."id" = w."id";

ALTER TABLE "Workspace" ALTER COLUMN "joinCode" SET NOT NULL;
CREATE UNIQUE INDEX "Workspace_joinCode_key" ON "Workspace"("joinCode");
