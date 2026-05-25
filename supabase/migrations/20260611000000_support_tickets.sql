-- Support tickets for admin panel
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "SupportTicket" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
  "adminNote" TEXT,
  "resolvedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket" ("userId");
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket" ("status");

-- RLS
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;

-- Users can create and view own tickets
CREATE POLICY "user_manage_own_tickets" ON "SupportTicket" FOR ALL
  USING (auth.uid()::text = "userId"::text)
  WITH CHECK (auth.uid()::text = "userId"::text);

-- Admins can manage all tickets
CREATE POLICY "admin_manage_tickets" ON "SupportTicket" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'
    )
  );
