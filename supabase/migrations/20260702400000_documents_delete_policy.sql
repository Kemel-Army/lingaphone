-- Lesson materials are stored in the existing private `documents` storage
-- bucket under `lesson-materials/<lessonId>/<file>`. The bucket already has
-- INSERT (upload) and SELECT (read/list/sign) policies for authenticated
-- users; it was missing a DELETE policy, so a teacher could not remove a
-- material they uploaded. Add it.

DROP POLICY IF EXISTS documents_auth_delete ON storage.objects;
CREATE POLICY documents_auth_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents');
