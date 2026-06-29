<script setup lang="ts">
import { useTeacher } from '~/entities/teacher'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const supabase = useSupabaseClient()
const { fetchTeacherProfile, updateTeacherProfile } = useTeacher()

const { data: profile, refresh } = await useAsyncData('teacher-profile', fetchTeacherProfile)

// ── Edit form ─────────────────────────────────────────────────────────────────
const editMode = ref(false)
const saving = ref(false)
const form = reactive({
  bio: '',
  yearsOfExperience: 0
})

const openEdit = () => {
  form.bio = profile.value?.bio ?? ''
  form.yearsOfExperience = profile.value?.yearsOfExperience ?? 0
  editMode.value = true
}

const saveProfile = async () => {
  if (!profile.value?.teacherId) return
  saving.value = true
  try {
    await updateTeacherProfile(profile.value.teacherId, form.bio, form.yearsOfExperience)
    await refresh()
    editMode.value = false
    toast.add({ title: 'Профиль обновлён', color: 'success', icon: 'i-lucide-check-circle' })
  } catch {
    toast.add({ title: 'Ошибка сохранения', color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    saving.value = false
  }
}

// ── Password change ───────────────────────────────────────────────────────────
const showPassword = ref(false)
const pwSaving = ref(false)
const pwForm = reactive({ current: '', next: '', confirm: '' })
const pwError = ref('')

const changePassword = async () => {
  pwError.value = ''
  if (pwForm.next.length < 6) {
    pwError.value = 'Минимум 6 символов'
    return
  }
  if (pwForm.next !== pwForm.confirm) {
    pwError.value = 'Пароли не совпадают'
    return
  }
  pwSaving.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) throw error
    pwForm.current = ''
    pwForm.next = ''
    pwForm.confirm = ''
    showPassword.value = false
    toast.add({ title: 'Пароль изменён', color: 'success', icon: 'i-lucide-lock' })
  } catch (e: unknown) {
    pwError.value = e instanceof Error ? e.message : 'Ошибка изменения пароля'
  } finally {
    pwSaving.value = false
  }
}

// ── Notification settings ─────────────────────────────────────────────────────
const notifSettings = reactive({
  soundEnabled: true,
  hwPushEnabled: true,
  afterHoursEnabled: false
})

// ── Avatar upload ─────────────────────────────────────────────────────────────
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarLoading = ref(false)

const uploadAvatar = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarLoading.value = true
  try {
    const ext = file.name.split('.').pop()
    const path = `avatars/${profile.value?.id ?? 'teacher'}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) throw upErr
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const { error: dbErr } = await supabase
      .from('User')
      .update({ avatarUrl: urlData.publicUrl })
      .eq('id', profile.value?.id ?? '')
    if (dbErr) throw dbErr
    await refresh()
    toast.add({ title: 'Аватар обновлён', color: 'success', icon: 'i-lucide-image' })
  } catch {
    toast.add({ title: 'Ошибка загрузки', color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    avatarLoading.value = false
  }
}

// ── Stars display ─────────────────────────────────────────────────────────────
const ratingStars = computed(() => {
  const r = Math.round(profile.value?.rating ?? 0)
  return Array.from({ length: 5 }, (_, i) => i < r)
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
    <!-- Header -->
    <div>
      <p class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
        Личный кабинет
      </p>
      <h1 class="text-2xl font-black tracking-tight mt-0.5">
        Мой профиль
      </h1>
    </div>

    <!-- Profile card -->
    <UCard>
      <div class="flex items-start gap-5 flex-wrap">
        <!-- Avatar -->
        <div class="relative shrink-0">
          <UAvatar
            :src="profile?.avatarUrl ?? undefined"
            :alt="`${profile?.name} ${profile?.surname}`"
            size="3xl"
          />
          <button
            class="absolute bottom-0 right-0 size-7 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
            :disabled="avatarLoading"
            @click="avatarInput?.click()"
          >
            <UIcon
              v-if="!avatarLoading"
              name="i-lucide-camera"
              class="size-3.5"
            />
            <UIcon
              v-else
              name="i-lucide-loader-2"
              class="size-3.5 animate-spin"
            />
          </button>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="uploadAvatar"
          >
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0 space-y-1.5">
          <h2 class="text-2xl font-bold">
            {{ profile?.name }} {{ profile?.surname }}
          </h2>
          <p class="text-sm text-muted">
            {{ profile?.email }}
          </p>

          <!-- Rating stars -->
          <div
            v-if="profile?.rating"
            class="flex items-center gap-1.5 mt-2"
          >
            <div class="flex gap-0.5">
              <UIcon
                v-for="(filled, i) in ratingStars"
                :key="i"
                name="i-lucide-star"
                class="size-4"
                :class="filled ? 'text-yellow-400 fill-yellow-400' : 'text-muted'"
              />
            </div>
            <span class="text-sm font-semibold">{{ profile.rating.toFixed(1) }}</span>
          </div>

          <div class="flex gap-3 mt-2 flex-wrap">
            <div
              v-if="profile?.yearsOfExperience"
              class="flex items-center gap-1.5 text-sm text-muted"
            >
              <UIcon
                name="i-lucide-briefcase"
                class="size-4"
              />
              {{ profile.yearsOfExperience }} {{ profile.yearsOfExperience === 1 ? 'год' : 'лет' }} опыта
            </div>
          </div>
        </div>

        <UButton
          icon="i-lucide-edit-2"
          variant="outline"
          size="sm"
          @click="openEdit"
        >
          Редактировать
        </UButton>
      </div>

      <!-- Bio -->
      <div
        v-if="profile?.bio && !editMode"
        class="mt-4 pt-4 border-t border-subtle"
      >
        <p class="text-xs text-muted uppercase tracking-wide font-bold mb-2">
          О себе
        </p>
        <p class="text-sm leading-relaxed">
          {{ profile.bio }}
        </p>
      </div>

      <!-- Edit form -->
      <div
        v-if="editMode"
        class="mt-4 pt-4 border-t border-subtle space-y-4"
      >
        <p class="text-sm font-semibold">
          Редактирование профиля
        </p>
        <UFormField label="О себе / Методология">
          <UTextarea
            v-model="form.bio"
            placeholder="Расскажите о своём подходе к обучению, методологии, специализации…"
            :rows="4"
          />
        </UFormField>
        <UFormField label="Лет опыта">
          <UInput
            v-model.number="form.yearsOfExperience"
            type="number"
            min="0"
            max="50"
            class="w-32"
          />
        </UFormField>
        <div class="flex gap-2">
          <UButton
            :loading="saving"
            icon="i-lucide-save"
            size="sm"
            @click="saveProfile"
          >
            Сохранить
          </UButton>
          <UButton
            variant="ghost"
            size="sm"
            @click="editMode = false"
          >
            Отмена
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- KPI stats -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <UCard class="text-center">
        <UIcon
          name="i-lucide-star"
          class="size-6 mx-auto text-yellow-400 mb-1"
        />
        <p class="text-2xl font-black">
          {{ (profile?.rating ?? 0).toFixed(1) }}
        </p>
        <p class="text-xs text-muted">
          Рейтинг
        </p>
      </UCard>
      <UCard class="text-center">
        <UIcon
          name="i-lucide-briefcase"
          class="size-6 mx-auto text-blue-500 mb-1"
        />
        <p class="text-2xl font-black">
          {{ profile?.yearsOfExperience ?? 0 }}
        </p>
        <p class="text-xs text-muted">
          Лет опыта
        </p>
      </UCard>
      <UCard class="text-center col-span-2 sm:col-span-1">
        <UIcon
          name="i-lucide-users"
          class="size-6 mx-auto text-primary mb-1"
        />
        <p class="text-2xl font-black text-primary">
          ∞
        </p>
        <p class="text-xs text-muted">
          Учеников
        </p>
      </UCard>
    </div>

    <!-- Security -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2 font-semibold">
          <UIcon
            name="i-lucide-lock"
            class="size-4 text-primary"
          />
          Безопасность
        </div>
      </template>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-sm">
              Пароль
            </p>
            <p class="text-xs text-muted">
              Измените пароль для входа в аккаунт
            </p>
          </div>
          <UButton
            variant="outline"
            size="sm"
            icon="i-lucide-key"
            @click="showPassword = !showPassword"
          >
            Изменить
          </UButton>
        </div>

        <div
          v-if="showPassword"
          class="rounded-xl bg-muted/30 p-4 space-y-3"
        >
          <UFormField label="Новый пароль">
            <UInput
              v-model="pwForm.next"
              type="password"
              placeholder="Минимум 6 символов"
            />
          </UFormField>
          <UFormField label="Подтвердите пароль">
            <UInput
              v-model="pwForm.confirm"
              type="password"
              placeholder="Повторите пароль"
            />
          </UFormField>
          <UAlert
            v-if="pwError"
            color="error"
            variant="subtle"
            :description="pwError"
            icon="i-lucide-alert-circle"
          />
          <div class="flex gap-2">
            <UButton
              size="sm"
              :loading="pwSaving"
              icon="i-lucide-save"
              @click="changePassword"
            >
              Сохранить пароль
            </UButton>
            <UButton
              size="sm"
              variant="ghost"
              @click="showPassword = false; pwError = ''"
            >
              Отмена
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Notification settings -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2 font-semibold">
          <UIcon
            name="i-lucide-bell"
            class="size-4 text-primary"
          />
          Уведомления
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-sm">
              Звуки уведомлений
            </p>
            <p class="text-xs text-muted">
              Звуковые сигналы при новых событиях
            </p>
          </div>
          <UToggle v-model="notifSettings.soundEnabled" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-sm">
              Пуш о сданных ДЗ
            </p>
            <p class="text-xs text-muted">
              Уведомления при сдаче домашних заданий
            </p>
          </div>
          <UToggle v-model="notifSettings.hwPushEnabled" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-sm">
              Уведомления вне рабочего времени
            </p>
            <p class="text-xs text-muted">
              Получать пуш-уведомления после 21:00
            </p>
          </div>
          <UToggle v-model="notifSettings.afterHoursEnabled" />
        </div>
      </div>
    </UCard>
  </div>
</template>
