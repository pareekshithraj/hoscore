-- Subscription billing: per-seat tracking, autopay, Razorpay subscription IDs
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billedSeats" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "autopayEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "razorpaySubscriptionId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "razorpayPlanId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_razorpaySubscriptionId_key" ON "Subscription"("razorpaySubscriptionId");

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "userCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paymentType" TEXT NOT NULL DEFAULT 'ONE_TIME';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "razorpaySubscriptionId" TEXT;
