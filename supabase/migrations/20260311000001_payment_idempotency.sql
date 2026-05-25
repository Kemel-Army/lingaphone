-- Add idempotencyKey to Payment for preventing double charges
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT UNIQUE;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS "idx_payment_idempotency" ON "Payment" ("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;
