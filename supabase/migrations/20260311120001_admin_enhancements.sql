-- Add nextPaymentDate to Subscription for manual override tracking
ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "nextPaymentDate" DATE;

-- Activity Log table for admin audit trail
CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES "User"(id),
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" UUID,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON "ActivityLog" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON "ActivityLog" ("action");
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON "ActivityLog" ("userId");

-- Platform Settings table (replaces localStorage)
CREATE TABLE IF NOT EXISTS "PlatformSettings" (
  "key" TEXT PRIMARY KEY,
  "value" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedBy" UUID REFERENCES "User"(id)
);

-- RLS policies
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlatformSettings" ENABLE ROW LEVEL SECURITY;

-- ActivityLog: admin read, service role write
CREATE POLICY "admin_read_activity_log" ON "ActivityLog"
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'ADMIN');

CREATE POLICY "service_insert_activity_log" ON "ActivityLog"
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'user_role' = 'ADMIN');

-- PlatformSettings: admin read/write
CREATE POLICY "admin_read_platform_settings" ON "PlatformSettings"
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'ADMIN');

CREATE POLICY "admin_write_platform_settings" ON "PlatformSettings"
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'ADMIN')
  WITH CHECK (auth.jwt() ->> 'user_role' = 'ADMIN');
