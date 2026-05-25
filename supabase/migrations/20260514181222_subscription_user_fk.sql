-- Subscription.userId was created without a FOREIGN KEY to User.id,
-- so PostgREST cannot resolve embeddings like Subscription?select=*,User(...)
-- and 400s the request. Add the constraint and reload the schema cache.

ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
