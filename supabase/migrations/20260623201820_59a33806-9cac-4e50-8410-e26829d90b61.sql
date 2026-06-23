
-- 1. Roles enum + table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('employee', 'ceo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Policies on user_roles
DROP POLICY IF EXISTS "Users see own roles" ON public.user_roles;
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo'));

DROP POLICY IF EXISTS "CEO manages roles" ON public.user_roles;
CREATE POLICY "CEO manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'))
  WITH CHECK (public.has_role(auth.uid(), 'ceo'));

-- 4. Add user_id to mood_submissions, link to auth.users
ALTER TABLE public.mood_submissions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill: leave existing rows with NULL user_id; they'll only be visible to CEO via new policies.

-- 5. Replace permissive policies
DROP POLICY IF EXISTS "Public can insert mood submissions" ON public.mood_submissions;
DROP POLICY IF EXISTS "Public can read mood submissions" ON public.mood_submissions;

-- Employees insert their own submission
CREATE POLICY "Employees insert own submission" ON public.mood_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Employees can read their own submissions
CREATE POLICY "Employees read own submissions" ON public.mood_submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- CEO can read all submissions
CREATE POLICY "CEO reads all submissions" ON public.mood_submissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'));

-- 6. Revoke anon access on Data API
REVOKE ALL ON public.mood_submissions FROM anon;
GRANT SELECT, INSERT ON public.mood_submissions TO authenticated;
GRANT ALL ON public.mood_submissions TO service_role;

-- 7. Remove mood_submissions from Realtime publication to stop public broadcast
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'mood_submissions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.mood_submissions';
  END IF;
END $$;

-- 8. Auto-assign 'employee' role on new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
