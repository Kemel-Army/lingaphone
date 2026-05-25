-- Create storage buckets with policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('homework-submissions', 'homework-submissions', false, 10485760, ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/webm', 'audio/wav'
  ]),
  ('lesson-recordings', 'lesson-recordings', false, 104857600, ARRAY['video/mp4', 'video/webm', 'audio/webm']),
  ('documents', 'documents', false, 10485760, ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ])
ON CONFLICT (id) DO NOTHING;

-- Avatars: public read, authenticated upload own
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Homework submissions: owner + tutor read, student upload own
CREATE POLICY "homework_auth_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'homework-submissions');

CREATE POLICY "homework_auth_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'homework-submissions');

-- Lesson recordings: participants can read, tutor can upload
CREATE POLICY "recordings_auth_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lesson-recordings');

CREATE POLICY "recordings_auth_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lesson-recordings');

-- Documents: authenticated can upload and read
CREATE POLICY "documents_auth_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "documents_auth_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');
