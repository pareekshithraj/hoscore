-- Universal identity auth hardening.
-- Adds verification + secure-OTP tracking fields to User and enforces global phone uniqueness.
-- Written additively (IF NOT EXISTS) so it is safe to run against an existing database.

-- Verification flag. Existing rows are assumed already-trusted so they are not locked out;
-- the column default for NEW rows is false (must verify via OTP).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "isVerified" = true WHERE "createdAt" < now();

-- New-row default reverts to false so future registrations require OTP verification.
ALTER TABLE "User" ALTER COLUMN "isVerified" SET DEFAULT false;

-- Secure OTP tracking.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "otpAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "otpLastSentAt" TIMESTAMP(3);

-- Global phone uniqueness. Blank/empty phones are normalised to NULL first so they do not
-- collide (Postgres allows multiple NULLs in a unique index).
UPDATE "User" SET "phone" = NULL WHERE "phone" = '';
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
