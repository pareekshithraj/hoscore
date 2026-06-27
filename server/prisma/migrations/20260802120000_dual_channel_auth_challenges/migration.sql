ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastOtpVerifiedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "AuthChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "emailOtpCode" TEXT,
  "emailOtpExpiresAt" TIMESTAMP(3),
  "emailOtpAttempts" INTEGER NOT NULL DEFAULT 0,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "phoneOtpCode" TEXT,
  "phoneOtpExpiresAt" TIMESTAMP(3),
  "phoneOtpAttempts" INTEGER NOT NULL DEFAULT 0,
  "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
  "requireEmail" BOOLEAN NOT NULL DEFAULT true,
  "requirePhone" BOOLEAN NOT NULL DEFAULT true,
  "emailFallback" BOOLEAN NOT NULL DEFAULT false,
  "smsFallback" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuthChallenge_userId_purpose_idx" ON "AuthChallenge"("userId", "purpose");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'AuthChallenge_userId_fkey'
  ) THEN
    ALTER TABLE "AuthChallenge"
      ADD CONSTRAINT "AuthChallenge_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
