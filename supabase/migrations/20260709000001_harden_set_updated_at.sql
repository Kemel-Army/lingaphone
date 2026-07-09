-- Harden public.set_updated_at(): pin search_path (Supabase security linter
-- 0011_function_search_path_mutable). Trigger touches only NEW, so empty
-- search_path is safe.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END $$;
