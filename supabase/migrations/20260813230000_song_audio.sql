-- Своё аудио для песен вместо YouTube.
--
-- Формат «слушай и вставляй пропущенные слова» требует, чтобы трек был у нас:
-- на YouTube нужного трека может не быть, ролик могут удалить, а на уроке
-- нередко нет доступа к нему вовсе. Поэтому файл грузится в Storage, а YouTube
-- остаётся необязательным дополнением для тех песен, где он уже проставлен.

ALTER TABLE "Song"
  ADD COLUMN "audioUrl" TEXT,
  ADD COLUMN "audioFileName" TEXT;

-- Уровень: раньше допускались только A2/B1/B2, но песни-«рыбы» вроде Happy
-- нужны на всех уровнях. NULL = песня доступна всем.
ALTER TABLE "Song" DROP CONSTRAINT IF EXISTS "Song_level_check";
ALTER TABLE "Song" ALTER COLUMN level DROP NOT NULL;
ALTER TABLE "Song"
  ADD CONSTRAINT "Song_level_check"
  CHECK (level IS NULL OR level IN ('A1', 'A2', 'B1', 'B2', 'C1'));

-- Песня должна быть проигрываемой: либо загруженный файл, либо YouTube.
-- Опубликовать «немую» песню теперь нельзя — именно так и появлялся
-- бесполезный экран «Видео недоступно».
ALTER TABLE "Song"
  ADD CONSTRAINT "Song_playable_when_published"
  CHECK ("isPublished" = false OR "audioUrl" IS NOT NULL OR "youtubeId" IS NOT NULL);

-- ─── Storage: bucket под аудио песен ────────────────────────────────────────
-- Публичный на чтение (как books) — ссылки отдаются ученикам напрямую.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'song-audio', 'song-audio', true, 52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "song_audio_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'song-audio');

-- Загружать и заменять треки могут только сотрудники.
CREATE POLICY "song_audio_staff_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'song-audio'
    AND (auth.jwt() ->> 'user_role') IN ('ADMIN', 'DIRECTOR', 'TEACHER')
  );

CREATE POLICY "song_audio_staff_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'song-audio'
    AND (auth.jwt() ->> 'user_role') IN ('ADMIN', 'DIRECTOR', 'TEACHER')
  );

CREATE POLICY "song_audio_staff_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'song-audio'
    AND (auth.jwt() ->> 'user_role') IN ('ADMIN', 'DIRECTOR', 'TEACHER')
  );

-- ─── RLS на саму таблицу Song ───────────────────────────────────────────────
-- Раньше существовала только политика чтения опубликованных песен, поэтому
-- завести песню из интерфейса было нельзя в принципе.
CREATE POLICY "Song_staff_read_all"
  ON "Song" FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('ADMIN', 'DIRECTOR', 'TEACHER'));

CREATE POLICY "Song_staff_insert"
  ON "Song" FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('ADMIN', 'DIRECTOR', 'TEACHER'));

CREATE POLICY "Song_staff_update"
  ON "Song" FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('ADMIN', 'DIRECTOR', 'TEACHER'));

CREATE POLICY "Song_staff_delete"
  ON "Song" FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('ADMIN', 'DIRECTOR', 'TEACHER'));
