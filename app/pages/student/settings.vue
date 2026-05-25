<script setup lang="ts">
import { useCurrentUser, useProfileSettings, useAvatarUpload } from '~/entities/user'
import { useAuthActions } from '~/features/auth'

definePageMeta({ layout: 'dashboard' })

const { currentUser, fullName, avatarUrl, refreshProfile, phone: currentPhone } = useCurrentUser()
const { saving, updateProfile, updatePassword } = useProfileSettings()
const { saveAvatarUrl } = useAvatarUpload()
const { logout } = useAuthActions()
const user = useSupabaseUser()
const toast = useAppToast()

type Section = 'profile' | 'account' | 'preferences'
const activeSection = ref<Section>('profile')

const sections: Array<{ id: Section, label: string, icon: string, hint: string }> = [
  { id: 'profile', label: 'Профиль', icon: 'i-lucide-user', hint: 'Имя, фамилия, телефон, аватар' },
  { id: 'account', label: 'Безопасность', icon: 'i-lucide-shield', hint: 'Смена пароля и выход' },
  { id: 'preferences', label: 'Настройки', icon: 'i-lucide-settings-2', hint: 'Язык, тема, уведомления' }
]

// ─── PROFILE ─────────────────────────────────────────────────────────────
const profileForm = reactive({
  name: '',
  surname: '',
  phone: ''
})
const profileDirty = computed(() =>
  profileForm.name !== (currentUser.value?.name ?? '')
  || profileForm.surname !== (currentUser.value?.surname ?? '')
  || (profileForm.phone || '') !== (currentPhone.value || '')
)
watch(currentUser, (u) => {
  if (!u) return
  profileForm.name = u.name
  profileForm.surname = u.surname
}, { immediate: true })
watch(currentPhone, (p) => {
  profileForm.phone = p ?? ''
}, { immediate: true })

const onAvatarUpdate = async (url: string) => {
  if (!user.value) return
  await saveAvatarUrl(user.value.sub, url)
  await refreshProfile()
}
const onAvatarError = (msg: string) => {
  toast.error('Загрузка не удалась', msg)
}

const handleSaveProfile = async () => {
  if (!profileDirty.value) return
  const ok = await updateProfile({
    name: profileForm.name,
    surname: profileForm.surname,
    phone: profileForm.phone || null
  })
  if (ok) await refreshProfile()
}

// ─── ACCOUNT / SECURITY ──────────────────────────────────────────────────
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordError = computed(() => {
  if (!passwordForm.newPassword && !passwordForm.confirmPassword) return null
  if (passwordForm.newPassword.length < 8) return 'Новый пароль: минимум 8 символов'
  if (passwordForm.newPassword === passwordForm.currentPassword) return 'Новый пароль должен отличаться от текущего'
  if (passwordForm.newPassword !== passwordForm.confirmPassword) return 'Пароли не совпадают'
  return null
})
const passwordValid = computed(() =>
  passwordForm.currentPassword.length > 0
  && passwordForm.newPassword.length >= 8
  && passwordForm.newPassword !== passwordForm.currentPassword
  && passwordForm.newPassword === passwordForm.confirmPassword
)

const handleChangePassword = async () => {
  if (!passwordValid.value) return
  const ok = await updatePassword(passwordForm.currentPassword, passwordForm.newPassword)
  if (ok) {
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    showCurrentPassword.value = false
    showNewPassword.value = false
    showConfirmPassword.value = false
  }
}

// ─── PREFERENCES ─────────────────────────────────────────────────────────
const { locale, setLocale } = useI18n()
const colorMode = useColorMode()

const localeOptions = [
  { value: 'ru', label: '🇷🇺 Русский' },
  { value: 'kz', label: '🇰🇿 Қазақша' }
]

const themePreference = computed({
  get: () => colorMode.preference,
  set: (val: string) => { colorMode.preference = val }
})

const themeOptions = [
  { value: 'system', label: '💻 Системная', icon: 'i-lucide-monitor' },
  { value: 'light', label: '☀️ Светлая', icon: 'i-lucide-sun' },
  { value: 'dark', label: '🌙 Тёмная', icon: 'i-lucide-moon' }
]

interface NotificationPrefs {
  homeworkReminders: boolean
  lessonReminders: boolean
  gradeAlerts: boolean
  weeklyDigest: boolean
  marketingEmails: boolean
}
const DEFAULT_PREFS: NotificationPrefs = {
  homeworkReminders: true,
  lessonReminders: true,
  gradeAlerts: true,
  weeklyDigest: false,
  marketingEmails: false
}
const notificationPrefs = useCookie<NotificationPrefs>('lingafon-notif-prefs', {
  default: () => DEFAULT_PREFS,
  watch: 'shallow'
})

const notifToggles: Array<{ key: keyof NotificationPrefs, label: string, hint: string, icon: string }> = [
  { key: 'homeworkReminders', label: 'Напоминания о ДЗ', hint: 'За день до дедлайна', icon: 'i-lucide-book-open' },
  { key: 'lessonReminders', label: 'Напоминания об уроках', hint: 'За 30 минут до начала', icon: 'i-lucide-clock' },
  { key: 'gradeAlerts', label: 'Новые оценки', hint: 'Когда педагог поставил отметку', icon: 'i-lucide-bar-chart-3' },
  { key: 'weeklyDigest', label: 'Недельная сводка', hint: 'По воскресеньям утром', icon: 'i-lucide-mail' },
  { key: 'marketingEmails', label: 'Новости школы', hint: 'События, акции, обновления', icon: 'i-lucide-megaphone' }
]
</script>

<template>
  <div class="relative">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 overflow-hidden"
    >
      <div class="absolute -top-20 right-1/4 size-80 rounded-full bg-primary-400/10 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <!-- Header -->
      <header class="mb-6 sm:mb-8 flex items-center gap-4">
        <AvatarUpload
          :src="avatarUrl"
          :name="currentUser?.name"
          :surname="currentUser?.surname"
          size="2xl"
          @update:src="onAvatarUpdate"
          @error="onAvatarError"
        />
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-widest text-primary">
            ⚙️ Настройки аккаунта
          </p>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight truncate">
            {{ fullName || 'Профиль' }}
          </h1>
          <p class="text-sm text-muted truncate">
            {{ currentUser?.email }}
          </p>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <!-- Section nav -->
        <nav class="space-y-1 lg:sticky lg:top-4 lg:self-start">
          <button
            v-for="s in sections"
            :key="s.id"
            type="button"
            class="w-full flex items-start gap-3 rounded-xl p-3 text-left transition"
            :class="activeSection === s.id
              ? 'bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-300'
              : 'hover:bg-elevated'"
            @click="activeSection = s.id"
          >
            <UIcon
              :name="s.icon"
              class="size-5 shrink-0 mt-0.5"
              :class="activeSection === s.id ? 'text-primary' : 'text-muted'"
            />
            <div class="min-w-0 flex-1">
              <p
                class="font-bold text-sm"
                :class="activeSection === s.id && 'text-primary'"
              >
                {{ s.label }}
              </p>
              <p class="text-xs text-muted mt-0.5 line-clamp-1">
                {{ s.hint }}
              </p>
            </div>
          </button>
        </nav>

        <!-- Section content -->
        <div class="min-w-0">
          <!-- ════════════════════════════════════════════════════════ -->
          <!-- PROFILE -->
          <!-- ════════════════════════════════════════════════════════ -->
          <section
            v-if="activeSection === 'profile'"
            class="space-y-5"
          >
            <article class="rounded-2xl border border-default bg-default p-5 sm:p-6">
              <h2 class="text-lg font-black mb-1">
                Личные данные
              </h2>
              <p class="text-sm text-muted mb-5">
                Эти данные видят педагоги и одноклассники
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Имя">
                  <UInput
                    v-model="profileForm.name"
                    placeholder="Алия"
                    icon="i-lucide-user"
                  />
                </UFormField>
                <UFormField label="Фамилия">
                  <UInput
                    v-model="profileForm.surname"
                    placeholder="Сериккызы"
                    icon="i-lucide-user"
                  />
                </UFormField>
                <UFormField
                  label="Телефон"
                  class="sm:col-span-2"
                  hint="Опционально — для напоминаний об уроках"
                >
                  <UInput
                    v-model="profileForm.phone"
                    placeholder="+7 (777) 123-45-67"
                    icon="i-lucide-phone"
                    type="tel"
                  />
                </UFormField>
              </div>

              <div class="flex items-center justify-between mt-5 pt-4 border-t border-default">
                <p
                  v-if="profileDirty"
                  class="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5"
                >
                  <UIcon
                    name="i-lucide-alert-circle"
                    class="size-3.5"
                  />
                  Есть несохранённые изменения
                </p>
                <p
                  v-else
                  class="text-xs text-muted"
                >
                  Всё сохранено
                </p>
                <UButton
                  label="Сохранить"
                  color="primary"
                  icon="i-lucide-check"
                  :loading="saving"
                  :disabled="!profileDirty"
                  @click="handleSaveProfile"
                />
              </div>
            </article>

            <article class="rounded-2xl border border-default bg-default p-5 sm:p-6">
              <h2 class="text-lg font-black mb-1">
                Фото профиля
              </h2>
              <p class="text-sm text-muted mb-4">
                JPG, PNG или WebP, до 5 МБ. Кликни по аватару в шапке выше
              </p>
              <div class="flex items-center gap-4 rounded-xl bg-elevated p-4">
                <UIcon
                  name="i-lucide-info"
                  class="size-5 text-info shrink-0"
                />
                <p class="text-sm text-muted">
                  Хороший аватар повышает узнаваемость в групповом чате и помогает педагогу запомнить тебя быстрее
                </p>
              </div>
            </article>
          </section>

          <!-- ════════════════════════════════════════════════════════ -->
          <!-- ACCOUNT / SECURITY -->
          <!-- ════════════════════════════════════════════════════════ -->
          <section
            v-else-if="activeSection === 'account'"
            class="space-y-5"
          >
            <article class="rounded-2xl border border-default bg-default p-5 sm:p-6">
              <h2 class="text-lg font-black mb-1">
                Смена пароля
              </h2>
              <p class="text-sm text-muted mb-4">
                Введи текущий пароль, потом новый дважды. Минимум 8 символов
              </p>

              <div class="space-y-4">
                <UFormField label="Текущий пароль">
                  <UInput
                    v-model="passwordForm.currentPassword"
                    placeholder="••••••••"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    icon="i-lucide-lock"
                    autocomplete="current-password"
                    :ui="{ trailing: 'pe-1' }"
                  >
                    <template #trailing>
                      <UButton
                        :icon="showCurrentPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                        color="neutral"
                        variant="link"
                        size="sm"
                        :aria-label="showCurrentPassword ? 'Скрыть пароль' : 'Показать пароль'"
                        @click="showCurrentPassword = !showCurrentPassword"
                      />
                    </template>
                  </UInput>
                </UFormField>

                <UFormField label="Новый пароль">
                  <UInput
                    v-model="passwordForm.newPassword"
                    placeholder="••••••••"
                    :type="showNewPassword ? 'text' : 'password'"
                    icon="i-lucide-key"
                    autocomplete="new-password"
                    :ui="{ trailing: 'pe-1' }"
                  >
                    <template #trailing>
                      <UButton
                        :icon="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                        color="neutral"
                        variant="link"
                        size="sm"
                        :aria-label="showNewPassword ? 'Скрыть пароль' : 'Показать пароль'"
                        @click="showNewPassword = !showNewPassword"
                      />
                    </template>
                  </UInput>
                </UFormField>

                <UFormField label="Подтверждение нового пароля">
                  <UInput
                    v-model="passwordForm.confirmPassword"
                    placeholder="••••••••"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    icon="i-lucide-key"
                    autocomplete="new-password"
                    :ui="{ trailing: 'pe-1' }"
                  >
                    <template #trailing>
                      <UButton
                        :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                        color="neutral"
                        variant="link"
                        size="sm"
                        :aria-label="showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'"
                        @click="showConfirmPassword = !showConfirmPassword"
                      />
                    </template>
                  </UInput>
                </UFormField>
              </div>

              <p
                v-if="passwordError"
                class="mt-3 text-xs text-red-500 font-bold flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-alert-circle"
                  class="size-3.5"
                />
                {{ passwordError }}
              </p>

              <div class="flex justify-end mt-4 pt-4 border-t border-default">
                <UButton
                  label="Обновить пароль"
                  color="primary"
                  icon="i-lucide-key"
                  :loading="saving"
                  :disabled="!passwordValid"
                  @click="handleChangePassword"
                />
              </div>
            </article>

            <!-- Danger zone -->
            <article class="rounded-2xl border border-red-300/40 bg-red-50/40 dark:bg-red-900/10 p-5 sm:p-6">
              <h2 class="text-lg font-black mb-1 text-red-600 dark:text-red-400">
                ⚠️ Опасная зона
              </h2>
              <p class="text-sm text-muted mb-4">
                Выйти из аккаунта на этом устройстве. Все данные сохранятся
              </p>
              <UButton
                label="Выйти из аккаунта"
                color="error"
                variant="outline"
                icon="i-lucide-log-out"
                @click="logout"
              />
            </article>
          </section>

          <!-- ════════════════════════════════════════════════════════ -->
          <!-- PREFERENCES -->
          <!-- ════════════════════════════════════════════════════════ -->
          <section
            v-else
            class="space-y-5"
          >
            <article class="rounded-2xl border border-default bg-default p-5 sm:p-6">
              <h2 class="text-lg font-black mb-1">
                Язык интерфейса
              </h2>
              <p class="text-sm text-muted mb-4">
                Меняется только язык кнопок и меню — английский для занятий остаётся
              </p>
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="opt in localeOptions"
                  :key="opt.value"
                  type="button"
                  class="rounded-xl border p-4 text-left transition"
                  :class="locale === opt.value
                    ? 'border-primary bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary'
                    : 'border-default hover:border-primary-300'"
                  @click="setLocale(opt.value as 'ru' | 'kz')"
                >
                  <p class="font-bold">
                    {{ opt.label }}
                  </p>
                  <p
                    v-if="locale === opt.value"
                    class="text-xs text-primary mt-1 font-bold inline-flex items-center gap-1"
                  >
                    <UIcon
                      name="i-lucide-check"
                      class="size-3.5"
                    />
                    Активен
                  </p>
                </button>
              </div>
            </article>

            <article class="rounded-2xl border border-default bg-default p-5 sm:p-6">
              <h2 class="text-lg font-black mb-1">
                Тема
              </h2>
              <p class="text-sm text-muted mb-4">
                Светлая для дня, тёмная для вечера, системная подстроится под устройство
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  v-for="opt in themeOptions"
                  :key="opt.value"
                  type="button"
                  class="rounded-xl border p-4 text-left transition"
                  :class="themePreference === opt.value
                    ? 'border-primary bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary'
                    : 'border-default hover:border-primary-300'"
                  @click="themePreference = opt.value"
                >
                  <UIcon
                    :name="opt.icon"
                    class="size-5 mb-1.5"
                    :class="themePreference === opt.value ? 'text-primary' : 'text-muted'"
                  />
                  <p class="font-bold text-sm">
                    {{ opt.label }}
                  </p>
                </button>
              </div>
            </article>

            <article class="rounded-2xl border border-default bg-default p-5 sm:p-6">
              <h2 class="text-lg font-black mb-1">
                Уведомления
              </h2>
              <p class="text-sm text-muted mb-4">
                Выбери, о чём напоминать. Настройки хранятся в браузере
              </p>

              <ul class="divide-y divide-default">
                <li
                  v-for="t in notifToggles"
                  :key="t.key"
                  class="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div class="size-10 shrink-0 rounded-xl bg-elevated flex items-center justify-center">
                    <UIcon
                      :name="t.icon"
                      class="size-5 text-primary"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-bold text-sm">
                      {{ t.label }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ t.hint }}
                    </p>
                  </div>
                  <USwitch v-model="notificationPrefs[t.key]" />
                </li>
              </ul>
            </article>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
