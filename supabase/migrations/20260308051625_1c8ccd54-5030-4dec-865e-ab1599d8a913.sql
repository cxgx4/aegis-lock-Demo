
-- Create records table
CREATE TABLE public.records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  identifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create secure_fields table
CREATE TABLE public.secure_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  encrypted_content TEXT,
  encrypted_field_1 TEXT,
  encrypted_field_2 TEXT,
  iv TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Disable RLS (demo app, no auth)
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_fields ENABLE ROW LEVEL SECURITY;

-- Allow all access (demo - no auth)
CREATE POLICY "Allow all access to records" ON public.records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to secure_fields" ON public.secure_fields FOR ALL USING (true) WITH CHECK (true);

-- Index for FK lookups
CREATE INDEX idx_secure_fields_record_id ON public.secure_fields(record_id);
