-- HospitalMap: persisted multi-floor map, the shared source of truth for the
-- map builder, live simulator, patient wayfinding, and the Android app.
CREATE TABLE IF NOT EXISTS "HospitalMap" (
  "id" TEXT NOT NULL,
  "hospitalId" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'Main Building',
  "cols" INTEGER NOT NULL DEFAULT 20,
  "rows" INTEGER NOT NULL DEFAULT 14,
  "floors" JSONB NOT NULL DEFAULT '[]',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HospitalMap_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HospitalMap_hospitalId_key" ON "HospitalMap"("hospitalId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'HospitalMap_hospitalId_fkey'
  ) THEN
    ALTER TABLE "HospitalMap"
      ADD CONSTRAINT "HospitalMap_hospitalId_fkey"
      FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- LivePosition: ephemeral location of a patient/asset/staff on the map, powering
-- patient location-share links and the live simulator overlay.
CREATE TABLE IF NOT EXISTS "LivePosition" (
  "id" TEXT NOT NULL,
  "hospitalId" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL DEFAULT 'PATIENT',
  "subjectId" TEXT NOT NULL,
  "label" TEXT,
  "floorId" TEXT NOT NULL,
  "cellR" INTEGER NOT NULL,
  "cellC" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "shareToken" TEXT,
  "shareExpires" TIMESTAMP(3),
  "note" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LivePosition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LivePosition_shareToken_key" ON "LivePosition"("shareToken");
CREATE INDEX IF NOT EXISTS "LivePosition_hospitalId_subjectType_status_idx" ON "LivePosition"("hospitalId", "subjectType", "status");
CREATE INDEX IF NOT EXISTS "LivePosition_hospitalId_subjectId_idx" ON "LivePosition"("hospitalId", "subjectId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'LivePosition_hospitalId_fkey'
  ) THEN
    ALTER TABLE "LivePosition"
      ADD CONSTRAINT "LivePosition_hospitalId_fkey"
      FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
