<script setup lang="ts">
import { registerFormSchema, type RegisterFormData } from '~/shared/lib/validators'
import { useAuthActions } from '../composables/useAuthActions'

const { t } = useI18n()

/**
 * Multi-step registration form.
 */
const { register, loading, error } = useAuthActions()

const form = reactive<RegisterFormData>({
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  surname: '',
  phone: '',
  role: 'STUDENT',
  grade: undefined
})

const validationErrors = ref<Record<string, string>>({})
const step = ref(1) // 1 = role + name, 2 = credentials + extras

// TUTOR role is hidden from B2C signup — FEMO is self-paced (student ↔ Femi)
const roleOptions = [
  { label: 'auth.student', value: 'STUDENT', icon: 'i-lucide-book-open', descKey: 'auth.studentDesc', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { label: 'auth.parent', value: 'PARENT', icon: 'i-lucide-heart', descKey: 'auth.parentDesc', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' }
]

const gradeOptions = Array.from({ length: 6 }, (_, i) => ({
  label: `${i + 1} ${t('auth.grade').toLowerCase()}`,
  value: i + 1
}))

function nextStep() {
  validationErrors.value = {}
  // Validate step 1 fields
  if (!form.name || form.name.length < 2) {
    validationErrors.value.name = 'Минимум 2 символа'
    return
  }
  if (!form.surname || form.surname.length < 2) {
    validationErrors.value.surname = 'Минимум 2 символа'
    return
  }
  step.value = 2
}

async function onSubmit() {
  validationErrors.value = {}
  const result = registerFormSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string
      validationErrors.value[key] = issue.message
    }
    return
  }
  await register(result.data)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold tracking-tight text-default">
        {{ $t('auth.createAccount') }}
      </h2>
      <p class="mt-2 text-sm text-muted">
        {{ $t('auth.stepOf', { step, total: 2 }) }} —
        {{ step === 1 ? $t('auth.step1Title') : $t('auth.step2Title') }}
      </p>
      <!-- Step indicator -->
      <div class="mt-4 flex gap-2">
        <div
          class="h-1 flex-1 rounded-full transition-colors"
          :class="'bg-primary'"
        />
        <div
          class="h-1 flex-1 rounded-full transition-colors"
          :class="step >= 2 ? 'bg-primary' : 'bg-muted'"
        />
      </div>
    </div>

    <form
      class="flex flex-col gap-5"
      @submit.prevent="step === 1 ? nextStep() : onSubmit()"
    >
      <UAlert
        v-if="error"
        color="error"
        icon="i-lucide-alert-circle"
        :title="error"
        variant="subtle"
      />

      <!-- Step 1: Role + Name -->
      <template v-if="step === 1">
        <!-- Role selector -->
        <div class="space-y-3">
          <label class="text-sm font-medium text-default">{{ $t('auth.iAm') }}</label>
          <div class="grid gap-3">
            <button
              v-for="opt in roleOptions"
              :key="opt.value"
              type="button"
              :class="[
                'group flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all',
                form.role === opt.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-transparent bg-elevated hover:bg-muted/50'
              ]"
              @click="form.role = opt.value as any"
            >
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-lg"
                :class="opt.color"
              >
                <UIcon
                  :name="opt.icon"
                  class="size-5"
                />
              </div>
              <div class="flex-1">
                <div class="text-sm font-semibold text-default">
                  {{ $t(opt.label) }}
                </div>
                <div class="text-xs text-muted">
                  {{ $t(opt.descKey) }}
                </div>
              </div>
              <div
                class="flex size-5 items-center justify-center rounded-full border-2 transition-colors"
                :class="form.role === opt.value ? 'border-primary bg-primary' : 'border-muted'"
              >
                <UIcon
                  v-if="form.role === opt.value"
                  name="i-lucide-check"
                  class="size-3 text-white"
                />
              </div>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            :label="$t('auth.name')"
            :error="validationErrors.name"
          >
            <UInput
              v-model="form.name"
              placeholder="Айдана"
              icon="i-lucide-user"
              size="xl"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="$t('auth.surname')"
            :error="validationErrors.surname"
          >
            <UInput
              v-model="form.surname"
              placeholder="Калиева"
              icon="i-lucide-user"
              size="xl"
              class="w-full"
            />
          </UFormField>
        </div>

        <UButton
          type="submit"
          :label="$t('common.next')"
          color="primary"
          size="xl"
          block
          trailing-icon="i-lucide-arrow-right"
          class="mt-2"
        />
      </template>

      <!-- Step 2: Credentials + extras -->
      <template v-if="step === 2">
        <UFormField
          label="Email"
          :error="validationErrors.email"
        >
          <UInput
            v-model="form.email"
            type="email"
            placeholder="name@example.com"
            icon="i-lucide-mail"
            size="xl"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            :label="$t('auth.password')"
            :error="validationErrors.password"
          >
            <UInput
              v-model="form.password"
              type="password"
              :placeholder="$t('auth.passwordMin')"
              icon="i-lucide-lock"
              size="xl"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="$t('auth.confirmPassword')"
            :error="validationErrors.confirmPassword"
          >
            <UInput
              v-model="form.confirmPassword"
              type="password"
              :placeholder="$t('auth.repeatPassword')"
              icon="i-lucide-lock"
              size="xl"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          :label="$t('auth.phoneOptional')"
          :error="validationErrors.phone"
        >
          <UInput
            v-model="form.phone"
            type="tel"
            placeholder="+7 XXX XXX XX XX"
            icon="i-lucide-phone"
            size="xl"
            class="w-full"
          />
        </UFormField>

        <!-- Student-specific: grade -->
        <UFormField
          v-if="form.role === 'STUDENT'"
          :label="$t('auth.grade')"
        >
          <USelectMenu
            v-model="form.grade"
            :items="gradeOptions"
            value-key="value"
            :placeholder="$t('auth.selectGrade')"
            class="w-full"
          />
        </UFormField>

        <div class="flex gap-3 mt-2">
          <UButton
            :label="$t('common.back')"
            color="neutral"
            variant="subtle"
            size="xl"
            icon="i-lucide-arrow-left"
            @click="step = 1"
          />
          <UButton
            type="submit"
            :label="$t('auth.createAccount')"
            color="primary"
            size="xl"
            class="flex-1"
            :loading="loading"
          />
        </div>
      </template>
    </form>

    <p class="mt-8 text-center text-sm text-muted">
      {{ $t('auth.hasAccount') }}
      <NuxtLink
        to="/login"
        class="font-semibold text-primary hover:underline"
      >
        {{ $t('auth.login') }}
      </NuxtLink>
    </p>
  </div>
</template>
