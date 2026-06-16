
CREATE TABLE public.mood_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  mood TEXT NOT NULL,
  score INTEGER NOT NULL,
  comment TEXT,
  submission_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mood_submissions_unique_per_day UNIQUE (employee_id, submission_date)
);

CREATE INDEX mood_submissions_date_idx ON public.mood_submissions (submission_date DESC);

GRANT SELECT, INSERT ON public.mood_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_submissions TO authenticated;
GRANT ALL ON public.mood_submissions TO service_role;

ALTER TABLE public.mood_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read mood submissions"
  ON public.mood_submissions FOR SELECT
  USING (true);

CREATE POLICY "Public can insert mood submissions"
  ON public.mood_submissions FOR INSERT
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_submissions;
ALTER TABLE public.mood_submissions REPLICA IDENTITY FULL;
