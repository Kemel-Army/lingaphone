<script setup lang="ts">
/**
 * Песни: загрузка трека и текста с пропусками.
 *
 * Аудио грузится файлом в Storage, а не ищется на YouTube — на уроке ролика
 * может не быть под рукой, да и нужного трека там может не оказаться вовсе.
 * YouTube остаётся необязательным полем для уже заведённых песен.
 */
import {
  useSongs,
  songLevelMeta,
  formatGapLyrics,
  parseGapLyrics,
  totalGaps,
  missingAnswers,
  SONG_LEVEL_OPTIONS,
  SONG_GENRE_LABELS,
  type Song,
  type SongGenre
} from '~/entities/song'
import { useManageSongs, type SongDraft } from '~/features/manage-songs'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchAllSongs, uploadAudio, createSong, updateSong, deleteSong, removeAudioFile } = useManageSongs()
const { fetchSongs } = useSongs()

const { data: songs, pending, refresh } = await useAsyncData('admin-songs', fetchAllSongs)

const GENRE_OPTIONS = [
  { label: 'Не указан', value: null },
  ...(Object.keys(SONG_GENRE_LABELS) as SongGenre[]).map(g => ({ label: SONG_GENRE_LABELS[g], value: g as SongGenre | null }))
]

// ─── Форма ───────────────────────────────────────────────────────────────────

const showForm = ref(false)
const editingId = ref<string | null>(null)
// Текст до правки — из него переносим построчные переводы.
const editingLyrics = ref<Song['lyrics']>([])
const saving = ref(false)
const formError = ref('')

const blank = (): SongDraft => ({
  title: '', artist: '', level: null, genre: null,
  youtubeId: '', lyricsRaw: '', isPublished: false
})
const form = reactive<SongDraft>(blank())

// Новый файл, выбранный в форме. null = аудио не меняем.
const audioFile = ref<File | null>(null)
const existingAudio = ref<{ url: string, fileName: string | null } | null>(null)

const parsed = computed(() => parseGapLyrics(form.lyricsRaw))
const gapTotal = computed(() => totalGaps(parsed.value))
// Импорт из методички даёт пустые скобки — слова вписывает преподаватель.
const gapsWithoutAnswer = computed(() => missingAnswers(parsed.value))
const linesTotal = computed(() => parsed.value.filter(l => l.text.trim().length > 0).length)

// Опубликовать можно только проигрываемую песню — это же требует и БД.
const willHaveAudio = computed(() => !!audioFile.value || !!existingAudio.value || !!form.youtubeId.trim())
const canSave = computed(() =>
  form.title.trim().length > 1
  && form.artist.trim().length > 0
  && gapTotal.value > 0
  // Публикуем только полностью готовую песню: есть аудио и все ответы.
  && (!form.isPublished || (willHaveAudio.value && gapsWithoutAnswer.value === 0))
)

const openCreate = () => {
  editingId.value = null
  editingLyrics.value = []
  Object.assign(form, blank())
  audioFile.value = null
  existingAudio.value = null
  formError.value = ''
  showForm.value = true
}

const openEdit = (song: Song) => {
  editingId.value = song.id
  editingLyrics.value = song.lyrics
  Object.assign(form, {
    title: song.title,
    artist: song.artist,
    level: song.level,
    genre: song.genre,
    youtubeId: song.youtubeId ?? '',
    lyricsRaw: formatGapLyrics(song.lyrics),
    isPublished: song.isPublished
  })
  audioFile.value = null
  existingAudio.value = song.audioUrl ? { url: song.audioUrl, fileName: song.audioFileName } : null
  formError.value = ''
  showForm.value = true
}

const onFilePick = (e: Event) => {
  const input = e.target as HTMLInputElement
  audioFile.value = input.files?.[0] ?? null
}

const submit = async () => {
  if (!canSave.value) return
  saving.value = true
  formError.value = ''
  try {
    const audio = audioFile.value ? await uploadAudio(audioFile.value) : null
    if (editingId.value) {
      const replaced = audio ? existingAudio.value?.url ?? null : null
      await updateSong(editingId.value, { ...form }, audio, editingLyrics.value)
      // Старый трек уже никому не нужен — иначе бакет копил бы мёртвые файлы.
      if (replaced) await removeAudioFile(replaced)
    } else {
      await createSong({ ...form }, audio)
    }
    toast.add({ title: editingId.value ? 'Песня обновлена' : 'Песня добавлена', color: 'success', icon: 'i-lucide-check' })
    showForm.value = false
    await refresh()
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message ?? String(e)
    formError.value = msg
    toast.add({ title: 'Ошибка', description: msg, color: 'error', icon: 'i-lucide-x' })
  } finally {
    saving.value = false
  }
}

const removing = ref<string | null>(null)
const remove = async (song: Song) => {
  if (!confirm(`Удалить песню «${song.title}»?`)) return
  removing.value = song.id
  try {
    await deleteSong(song)
    toast.add({ title: 'Песня удалена', color: 'success', icon: 'i-lucide-trash' })
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка', description: (e as { message?: string })?.message ?? String(e), color: 'error' })
  } finally {
    removing.value = null
  }
}

// Сколько песен реально доступно ученику — то, что видно через публичный запрос.
const { data: publishedCount } = await useAsyncData('admin-songs-published', async () => (await fetchSongs()).length)
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">
          Песни
        </h1>
        <p class="text-sm text-muted mt-0.5">
          Слушают и вставляют пропущенные слова · {{ publishedCount ?? 0 }} опубликовано
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        @click="openCreate"
      >
        Добавить песню
      </UButton>
    </div>

    <div
      v-if="pending"
      class="flex justify-center py-20"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="!songs?.length"
      class="rounded-2xl border border-default py-16 text-center text-sm text-muted"
    >
      <UIcon
        name="i-lucide-music"
        class="mx-auto mb-2 size-8 opacity-30"
      />
      Пока нет ни одной песни
    </div>

    <div
      v-else
      class="grid gap-3 sm:grid-cols-2"
    >
      <div
        v-for="song in songs"
        :key="song.id"
        class="rounded-2xl border border-default p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate font-bold">
              {{ song.title }}
            </p>
            <p class="truncate text-sm text-muted">
              {{ song.artist }}
            </p>
          </div>
          <UBadge
            :color="song.isPublished ? 'success' : 'neutral'"
            variant="subtle"
            size="sm"
            class="shrink-0"
          >
            {{ song.isPublished ? 'Опубликована' : 'Черновик' }}
          </UBadge>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-1.5">
          <UBadge
            :class="[songLevelMeta(song.level).bg, songLevelMeta(song.level).color]"
            variant="subtle"
            size="sm"
          >
            {{ song.level ?? 'Все уровни' }}
          </UBadge>
          <UBadge
            :color="song.audioUrl ? 'primary' : song.youtubeId ? 'info' : 'error'"
            variant="subtle"
            size="sm"
            :icon="song.audioUrl ? 'i-lucide-file-audio' : song.youtubeId ? 'i-simple-icons-youtube' : 'i-lucide-volume-x'"
          >
            {{ song.audioUrl ? 'Файл' : song.youtubeId ? 'YouTube' : 'Без аудио' }}
          </UBadge>
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ totalGaps(song.lyrics) }} пропусков
          </UBadge>
        </div>

        <audio
          v-if="song.audioUrl"
          :src="song.audioUrl"
          controls
          preload="none"
          class="mt-3 w-full"
        />

        <div class="mt-3 flex items-center gap-2">
          <UButton
            icon="i-lucide-pencil"
            size="sm"
            variant="soft"
            @click="openEdit(song)"
          >
            Редактировать
          </UButton>
          <UButton
            icon="i-lucide-trash-2"
            size="sm"
            variant="soft"
            color="error"
            :loading="removing === song.id"
            @click="remove(song)"
          >
            Удалить
          </UButton>
        </div>
      </div>
    </div>

    <!-- ─── Форма ────────────────────────────────────────────────────────── -->
    <UModal
      v-model:open="showForm"
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #content>
        <div class="max-h-[85vh] space-y-4 overflow-y-auto p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold">
              {{ editingId ? 'Редактировать песню' : 'Новая песня' }}
            </h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showForm = false"
            />
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField
              label="Название"
              required
            >
              <UInput
                v-model="form.title"
                placeholder="Happy"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Исполнитель"
              required
            >
              <UInput
                v-model="form.artist"
                placeholder="Pharrell Williams"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Уровень">
              <USelect
                v-model="form.level"
                :items="SONG_LEVEL_OPTIONS"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Жанр">
              <USelect
                v-model="form.genre"
                :items="GENRE_OPTIONS"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            label="Аудиофайл"
            :help="existingAudio ? `Загружен: ${existingAudio.fileName ?? 'файл'} — выбери новый, чтобы заменить` : 'mp3 / m4a / ogg / wav, до 50 МБ'"
          >
            <input
              type="file"
              accept="audio/*,.mp3,.mpeg,.mpga,.m4a,.ogg,.oga,.opus,.wav,.webm"
              class="w-full rounded-lg border border-default p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-inverted"
              @change="onFilePick"
            >
          </UFormField>
          <audio
            v-if="existingAudio && !audioFile"
            :src="existingAudio.url"
            controls
            preload="none"
            class="w-full"
          />
          <p
            v-if="audioFile"
            class="text-sm text-primary"
          >
            Будет загружен: {{ audioFile.name }}
          </p>

          <UFormField
            label="YouTube ID"
            help="Необязательно — запасной вариант, если файла нет"
          >
            <UInput
              v-model="form.youtubeId"
              placeholder="RBumgng_BS4"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Текст с пропусками"
            required
            help="Вставь оригинальный текст и оберни пропадающие слова в квадратные скобки"
          >
            <UTextarea
              v-model="form.lyricsRaw"
              :rows="10"
              class="w-full font-mono text-sm"
              placeholder="It might seem [crazy] what I'm 'bout to say&#10;Clap [along] if you feel like a room without a [roof]"
            />
          </UFormField>

          <div class="flex flex-wrap items-center gap-2 text-sm">
            <UBadge
              :color="gapTotal > 0 ? 'success' : 'neutral'"
              variant="subtle"
            >
              {{ gapTotal }} пропусков
            </UBadge>
            <UBadge
              color="neutral"
              variant="subtle"
            >
              {{ linesTotal }} строк
            </UBadge>
            <UBadge
              v-if="gapsWithoutAnswer > 0"
              color="warning"
              variant="subtle"
              icon="i-lucide-pencil-line"
            >
              без ответа: {{ gapsWithoutAnswer }}
            </UBadge>
            <span
              v-if="gapTotal === 0"
              class="text-muted"
            >
              Отметь хотя бы одно слово скобками
            </span>
          </div>
          <p
            v-if="gapsWithoutAnswer > 0"
            class="text-sm text-muted"
          >
            Пустые скобки <code class="rounded bg-elevated px-1">[]</code> — это пропуски из методички,
            слово в них ещё не вписано. Впиши слово внутрь скобок.
          </p>

          <UCheckbox
            v-model="form.isPublished"
            label="Опубликовать — песня появится у учеников"
          />
          <p
            v-if="form.isPublished && !willHaveAudio"
            class="text-sm font-semibold text-amber-600"
          >
            Нельзя опубликовать песню без аудио: загрузи файл или укажи YouTube ID
          </p>
          <p
            v-if="form.isPublished && gapsWithoutAnswer > 0"
            class="text-sm font-semibold text-amber-600"
          >
            Нельзя опубликовать: {{ gapsWithoutAnswer }} пропусков без ответа — ученик не сможет их пройти
          </p>

          <p
            v-if="formError"
            class="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300"
          >
            {{ formError }}
          </p>

          <div class="flex justify-end gap-2 pt-1">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showForm = false"
            >
              Отмена
            </UButton>
            <UButton
              :disabled="!canSave"
              :loading="saving"
              @click="submit"
            >
              {{ editingId ? 'Сохранить' : 'Добавить' }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
