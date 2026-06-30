-- Store the admin-assigned initial password so it can be reprinted in the
-- students export (PDF/Excel). Admin-created accounts only.
--
-- SECURITY: this is plaintext credential storage — readable by anyone with
-- admin/service-role access to the User table. Kept deliberately, since admins
-- need to hand out login + password sheets. Do not expose to non-admin roles.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "initialPassword" text;
