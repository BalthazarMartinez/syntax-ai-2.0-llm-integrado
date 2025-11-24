-- Create storage bucket for input files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inputs-files',
  'inputs-files',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for inputs-files bucket
CREATE POLICY "Authenticated users can upload input files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inputs-files'
);

CREATE POLICY "Authenticated users can view their input files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'inputs-files');

CREATE POLICY "Authenticated users can delete input files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'inputs-files');