<script setup lang="ts">
import { useCurrentUser, useProfileSettings, useAvatarUpload } from '~/entities/user'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const toast = useToast()
const { currentUser, phone, refreshProfile } = useCurrentUser()
const { updateProfile, updatePassword } = useProfileSettings()
const { saveAvatarUrl } = useAvatarUpload()

// ─── Profile form ─────────────────────────────────────────────────────────────

const profileForm = reactive({
  name: '',
  surname: '',
  patronymic: '',
  phone: '',
  email: ''
})

const profileSaving = ref(false)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)

// Prefill once currentUser/profile resolves (both are async via JWT + useAsyncData).
watchEffect(() => {
  if (!currentUser.value) return
  profileForm.name = currentUser.value.name ?? ''
  profileForm.surname = currentUser.value.surname ?? ''
  profileForm.phone = phone.value ?? ''
  profileForm.email = currentUser.value.email ?? ''
})

const onAvatarChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

const saveProfile = async () => {
  if (!currentUser.value) return
  profileSaving.value = true
  try {
    const authId = currentUser.value.sub

    // Upload avatar if changed, then persist its URL to the User row.
    // Storage RLS requires the first path segment to equal auth.uid(), so the
    // object must live under `${authId}/…` inside the avatars bucket.
    if (avatarFile.value) {
      const ext = avatarFile.value.name.split('.').pop()
      const path = `${authId}/avatar.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile.value, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      await saveAvatarUrl(authId, urlData.publicUrl)
    }

    // Update User record (filtered by authId — User.id is NOT the auth UUID).
    const ok = await updateProfile({
      name: profileForm.name,
      surname: profileForm.surname,
      phone: profileForm.phone
    })
    if (!ok) return

    avatarFile.value = null
    avatarPreview.value = null
    await refreshProfile()
  } catch {
    toast.add({ title: 'Ошибка сохранения', color: 'error', icon: 'i-lucide-x' })
  } finally {
    profileSaving.value = false
  }
}

// ─── Password form ────────────────────────────────────────────────────────────

const pwForm = reactive({
  current: '',
  next: '',
  confirm: ''
})

const pwSaving = ref(false)
const showCurrent = ref(false)
const showNext = ref(false)
const showConfirm = ref(false)

const pwErrors = computed(() => {
  const errors: string[] = []
  if (pwForm.next && pwForm.next.length < 8) errors.push('Пароль должен быть минимум 8 символов')
  if (pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm) errors.push('Пароли не совпадают')
  return errors
})

const canSavePw = computed(() =>
  pwForm.current && pwForm.next.length >= 8
  && pwForm.next === pwForm.confirm && !pwErrors.value.length
)

const savePassword = async () => {
  if (!canSavePw.value) return
  pwSaving.value = true
  try {
    const ok = await updatePassword(pwForm.current, pwForm.next)
    if (!ok) return
    pwForm.current = ''
    pwForm.next = ''
    pwForm.confirm = ''
  } finally {
    pwSaving.value = false
  }
}

const displayAvatar = computed(() =>
  avatarPreview.value ?? currentUser.value?.avatarUrl ?? undefined
)
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
    <div>
      <h1 class="text-2xl font-bold">
        Настройки
      </h1>
      <p class="text-sm text-muted mt-0.5">
        Управление личными данными и безопасностью
      </p>
    </div>

    <!-- ─── Profile card ───────────────────────────────────────────────────── -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-user"
            class="size-4 text-primary"
          />
          <h2 class="font-semibold">
            Личные данные
          </h2>
        </div>
      </template>

      <div class="space-y-5">
        <!-- Avatar -->
        <div class="flex items-center gap-4">
          <div class="relative">
            <UAvatar
              :src="displayAvatar"
              :alt="`${profileForm.name} ${profileForm.surname}`"
              size="xl"
            />
            <button
              class="absolute -bottom-1 -right-1 size-7 rounded-full bg-primary text-white flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
              @click="avatarInput?.click()"
            >
              <UIcon
                name="i-lucide-camera"
                class="size-3.5"
              />
            </button>
          </div>
          <div>
            <p class="text-sm font-medium">
              Фото профиля
            </p>
            <p class="text-xs text-muted">
              JPG, PNG до 2 МБ
            </p>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onAvatarChange"
            >
          </div>
        </div>

        <UDivider />

        <!-- Name fields -->
        <div class="grid grid-cols-2 gap-3">
          <UFormField
            label="Фамилия"
            required
          >
            <UInput
              v-model="profileForm.surname"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Имя"
            required
          >
            <UInput
              v-model="profileForm.name"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Телефон">
          <UInput
            v-model="profileForm.phone"
            placeholder="+7 777 000 00 00"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Email">
          <UInput
            v-model="profileForm.email"
            type="email"
            disabled
            class="w-full opacity-60"
          />
          <template #hint>
            <span class="text-xs text-muted">Email изменить нельзя</span>
          </template>
        </UFormField>

        <div class="flex justify-end">
          <UButton
            :loading="profileSaving"
            icon="i-lucide-save"
            @click="saveProfile"
          >
            Сохранить профиль
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- ─── Password card ──────────────────────────────────────────────────── -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-lock"
            class="size-4 text-primary"
          />
          <h2 class="font-semibold">
            Безопасность
          </h2>
        </div>
      </template>

      <div class="space-y-4">
        <UFormField
          label="Текущий пароль"
          required
        >
          <div class="flex gap-2">
            <UInput
              v-model="pwForm.current"
              :type="showCurrent ? 'text' : 'password'"
              placeholder="••••••••"
              class="flex-1"
            />
            <UButton
              :icon="showCurrent ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              variant="ghost"
              color="neutral"
              @click="showCurrent = !showCurrent"
            />
          </div>
        </UFormField>

        <UFormField
          label="Новый пароль"
          required
          hint="Минимум 8 символов"
        >
          <div class="flex gap-2">
            <UInput
              v-model="pwForm.next"
              :type="showNext ? 'text' : 'password'"
              placeholder="••••••••"
              class="flex-1"
            />
            <UButton
              :icon="showNext ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              variant="ghost"
              color="neutral"
              @click="showNext = !showNext"
            />
          </div>
        </UFormField>

        <UFormField
          label="Подтвердите новый пароль"
          required
        >
          <div class="flex gap-2">
            <UInput
              v-model="pwForm.confirm"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="••••••••"
              class="flex-1"
              :class="pwForm.confirm && pwForm.next !== pwForm.confirm ? 'ring-1 ring-red-500' : ''"
            />
            <UButton
              :icon="showConfirm ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              variant="ghost"
              color="neutral"
              @click="showConfirm = !showConfirm"
            />
          </div>
        </UFormField>

        <!-- Errors -->
        <div
          v-if="pwErrors.length"
          class="space-y-1"
        >
          <p
            v-for="err in pwErrors"
            :key="err"
            class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5"
          >
            <UIcon
              name="i-lucide-alert-circle"
              class="size-3.5 shrink-0"
            />
            {{ err }}
          </p>
        </div>

        <div class="flex justify-end">
          <UButton
            :disabled="!canSavePw || pwSaving"
            :loading="pwSaving"
            icon="i-lucide-shield-check"
            color="error"
            variant="soft"
            @click="savePassword"
          >
            Изменить пароль
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
