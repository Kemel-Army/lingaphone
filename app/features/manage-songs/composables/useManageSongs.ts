import type { Database } from '~/shared/types/database.types'
import { parseGapLyrics, preserveTranslations, type LyricLine, type Song, type SongGenre, type SongLevel } from '~/entities/song'

const BUCKET = 'song-audio'

export interface SongDraft {
  title: string
  artist: string
  level: SongLevel | null
  genre: SongGenre | null
  /** Пустая строка = не задан; в БД уходит NULL. */
  youtubeId: string
  /** Текст с пропусками в квадратных скобках: `Clap [along] if you…` */
  lyricsRaw: string
  isPublished: boolean
}

/**
 * Управление песнями из админки: загрузка трека в Storage и запись самой песни.
 *
 * Мультишаговое действие (файл → Storage → публичная ссылка → строка в БД),
 * поэтому живёт в features, а не в entities.
 */
export const useManageSongs = () => {
  const supabase = useSupabaseClient<Database>()

  /** Все песни, включая черновики — админу нужны и неопубликованные. */
  const fetchAllSongs = async (): Promise<Song[]> => {
    const { data, error } = await supabase
      .from('Song')
      .select('*')
      .order('createdAt', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as Song[]
  }

  /**
   * MIME-тип, с которым файл примет бакет.
   *
   * Браузер помечает `.mpeg` как `video/mpeg` — а именно так приходит аудио из
   * WhatsApp, которым и пользуются преподаватели. Бакет пускает только `audio/*`,
   * поэтому загрузка падала с 400 на самом обычном для школы файле. Определяем
   * тип по расширению, а тип из браузера берём только если он и так аудийный.
   */
  const AUDIO_MIME_BY_EXT: Record<string, string> = {
    mp3: 'audio/mpeg',
    mpeg: 'audio/mpeg',
    mpga: 'audio/mpeg',
    m4a: 'audio/mp4',
    mp4: 'audio/mp4',
    aac: 'audio/mp4',
    ogg: 'audio/ogg',
    oga: 'audio/ogg',
    opus: 'audio/ogg',
    wav: 'audio/wav',
    webm: 'audio/webm'
  }

  const audioContentType = (file: File): string => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    return AUDIO_MIME_BY_EXT[ext]
      ?? (file.type.startsWith('audio/') ? file.type : 'audio/mpeg')
  }

  /**
   * Кладём файл в бакет и возвращаем публичную ссылку.
   *
   * Имя формируем сами (транслит + метка времени): исходные имена приходят
   * кириллицей и с пробелами, а Storage такие ключи отдаёт битой ссылкой.
   */
  const uploadAudio = async (file: File): Promise<{ url: string, fileName: string }> => {
    const ext = (file.name.split('.').pop() ?? 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '')
    const slug = file.name
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'track'
    const path = `${slug}-${Date.now()}.${ext}`

    // Перепаковываем файл с исправленным типом, а не полагаемся на опцию
    // `contentType`: supabase-js шлёт multipart, и Storage проверяет тип самой
    // части, то есть `File.type` из браузера. Для WhatsApp-аудио это
    // «video/mpeg», и загрузка падала с 415 несмотря на верную опцию.
    const contentType = audioContentType(file)
    const payload = file.type === contentType ? file : new File([file], path, { type: contentType })

    const { error } = await supabase.storage.from(BUCKET).upload(path, payload, {
      contentType,
      upsert: false
    })
    if (error) throw error

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return { url: data.publicUrl, fileName: file.name }
  }

  /**
   * `previousLyrics` — текст песни до правки. Авторский формат не хранит
   * построчные переводы, поэтому без него любое сохранение стирало бы русские
   * подсказки под строками.
   */
  const toRow = (
    draft: SongDraft,
    audio: { url: string, fileName: string } | null,
    previousLyrics: LyricLine[] = []
  ) => ({
    title: draft.title.trim(),
    artist: draft.artist.trim(),
    level: draft.level,
    genre: draft.genre,
    youtubeId: draft.youtubeId.trim() || null,
    lyrics: preserveTranslations(previousLyrics, parseGapLyrics(draft.lyricsRaw)),
    isPublished: draft.isPublished,
    ...(audio ? { audioUrl: audio.url, audioFileName: audio.fileName } : {})
  })

  const createSong = async (draft: SongDraft, audio: { url: string, fileName: string } | null): Promise<Song> => {
    const { data, error } = await supabase
      .from('Song')
      .insert(toRow(draft, audio) as never)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as Song
  }

  const updateSong = async (
    id: string,
    draft: SongDraft,
    audio: { url: string, fileName: string } | null,
    previousLyrics: LyricLine[] = []
  ): Promise<Song> => {
    const { data, error } = await supabase
      .from('Song')
      .update(toRow(draft, audio, previousLyrics) as never)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as Song
  }

  /**
   * Путь внутри бакета из публичной ссылки.
   * `…/object/public/song-audio/track-123.mp3` → `track-123.mp3`
   */
  const storagePathOf = (url: string | null): string | null => {
    if (!url) return null
    const marker = `/object/public/${BUCKET}/`
    const at = url.indexOf(marker)
    return at === -1 ? null : decodeURIComponent(url.slice(at + marker.length))
  }

  /**
   * Убираем файл, на который больше никто не ссылается.
   *
   * Без этого бакет копил мёртвые треки: удалённые песни и заменённые аудио
   * оставались лежать навсегда, а места они занимают куда больше строк в БД.
   * Ошибку глушим — она не должна валить основную операцию.
   */
  const removeAudioFile = async (url: string | null): Promise<void> => {
    const path = storagePathOf(url)
    if (!path) return
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
  }

  const deleteSong = async (song: Pick<Song, 'id' | 'audioUrl'>): Promise<void> => {
    const { error } = await supabase.from('Song').delete().eq('id', song.id)
    if (error) throw error
    await removeAudioFile(song.audioUrl)
  }

  return { fetchAllSongs, uploadAudio, createSong, updateSong, deleteSong, removeAudioFile }
}
