GRANT SELECT, INSERT ON public.mood_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_submissions TO authenticated;
GRANT ALL ON public.mood_submissions TO service_role;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mood_submissions' AND policyname='Anyone can read mood submissions') THEN
    CREATE POLICY "Anyone can read mood submissions" ON public.mood_submissions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mood_submissions' AND policyname='Anyone can insert mood submissions') THEN
    CREATE POLICY "Anyone can insert mood submissions" ON public.mood_submissions FOR INSERT WITH CHECK (true);
  END IF;
END $$;