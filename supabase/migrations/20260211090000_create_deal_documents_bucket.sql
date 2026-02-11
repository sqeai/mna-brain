-- Create the storage bucket for deal documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-documents', 'deal-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket (storage.objects is already enabled by default, but good to ensure policies target it)

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload deal documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'deal-documents');

-- Policy: Allow authenticated users to view/download files
CREATE POLICY "Authenticated users can view deal documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'deal-documents');

-- Policy: Allow authenticated users to update their own files (or all files if shared)
-- For now, allowing update/delete if they have access to the bucket seems reasonable for a team tool
CREATE POLICY "Authenticated users can update deal documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'deal-documents');

CREATE POLICY "Authenticated users can delete deal documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'deal-documents');
