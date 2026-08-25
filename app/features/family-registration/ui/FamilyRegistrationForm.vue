<script setup lang="ts">
import { useFamilyRegistration } from '../composables/useFamilyRegistration'
import { emptyChild, emptyParent, type ChildFormData, type FamilyRegistrationResult, type ParentFormData } from '../model/types'
import CredentialsModal from './CredentialsModal.vue'

const { submit, loading } = useFamilyRegistration()

const step = ref<1 | 2 | 3>(1)
const steps = [
  { key: 1, labelKey: 'auth.familyRegister.stepParents' },
  { key: 2, labelKey: 'auth.familyRegister.stepChildren' },
  { key: 3, labelKey: 'auth.familyRegister.stepReview' }
]

const parent1 = reactive<ParentFormData>(emptyParent())
const hasParent2 = ref(false)
const parent2 = reactive<ParentFormData>(emptyParent())
const children = reactive<ChildFormData[]>([emptyChild()])

const errors = ref<Record<string, string>>({})

function addChild() {
  if (children.length >= 6) return
  children.push(emptyChild())
}
function removeChild(index: number) {
  if (children.length <= 1) return
  children.splice(index, 1)
}

function validateParent(p: ParentFormData, prefix: string) {
  if (!p.name.trim() || p.name.trim().length < 2) errors.value[`${prefix}.name`] = 'Минимум 2 символа'
  if (!p.surname.trim() || p.surname.trim().length < 2) errors.value[`${prefix}.surname`] = 'Минимум 2 символа'
  if (!/^\+?\d[\d\s\-()]{6,}$/.test(p.phone.trim())) errors.value[`${prefix}.phone`] = 'Некорректный телефон'
  if (!/^\S+@\S+\.\S+$/.test(p.email.trim())) errors.value[`${prefix}.email`] = 'Некорректный email'
}

function validateStep1() {
  errors.value = {}
  validateParent(parent1, 'parent1')
  if (hasParent2.value) validateParent(parent2, 'parent2')
  if (hasParent2.value && parent1.email.trim().toLowerCase() === parent2.email.trim().toLowerCase() && parent1.email.trim()) {
    errors.value['parent2.email'] = 'Email должен отличаться от первого родителя'
  }
  return Object.keys(errors.value).length === 0
}

function validateStep2() {
  errors.value = {}
  children.forEach((c, i) => {
    if (!c.name.trim() || c.name.trim().length < 2) errors.value[`child${i}.name`] = 'Минимум 2 символа'
    if (!c.surname.trim() || c.surname.trim().length < 2) errors.value[`child${i}.surname`] = 'Минимум 2 символа'
  })
  return Object.keys(errors.value).length === 0
}

function nextFromStep1() {
  if (validateStep1()) step.value = 2
}
function nextFromStep2() {
  if (validateStep2()) step.value = 3
}

const gradeOptions = Array.from({ length: 11 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))

const showCredentials = ref(false)
const registrationResult = ref<FamilyRegistrationResult | null>(null)

async function onSubmit() {
  const data = await submit({
    parent1,
    parent2: hasParent2.value ? parent2 : null,
    children
  })
  if (data) {
    registrationResult.value = data
    showCredentials.value = true
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h2 class="text-2xl font-bold tracking-tight text-default">
        {{ $t('auth.familyRegister.title') }}
      </h2>
      <p class="mt-2 text-sm text-muted">
        {{ $t('auth.familyRegister.subtitle') }}
      </p>
      <div class="mt-4 flex gap-2">
        <div
          v-for="s in steps"
          :key="s.key"
          class="h-1 flex-1 rounded-full transition-colors"
          :class="step >= s.key ? 'bg-primary' : 'bg-muted'"
        />
      </div>
    </div>

    <!-- Step 1: parents -->
    <div
      v-if="step === 1"
      class="flex flex-col gap-6"
    >
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-default">
          {{ $t('auth.familyRegister.parent1') }}
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            :label="$t('auth.name')"
            :error="errors['parent1.name']"
          >
            <UInput
              v-model="parent1.name"
              size="xl"
              class="w-full"
            />
          </UFormField>
          <UFormField
            :label="$t('auth.surname')"
            :error="errors['parent1.surname']"
          >
            <UInput
              v-model="parent1.surname"
              size="xl"
              class="w-full"
            />
          </UFormField>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            :label="$t('auth.phone')"
            :error="errors['parent1.phone']"
          >
            <UInput
              v-model="parent1.phone"
              type="tel"
              placeholder="+7 XXX XXX XX XX"
              icon="i-lucide-phone"
              size="xl"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Email"
            :error="errors['parent1.email']"
          >
            <UInput
              v-model="parent1.email"
              type="email"
              icon="i-lucide-mail"
              size="xl"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <UButton
        v-if="!hasParent2"
        :label="$t('auth.familyRegister.addParent2')"
        icon="i-lucide-plus"
        color="neutral"
        variant="subtle"
        @click="hasParent2 = true"
      />

      <div
        v-if="hasParent2"
        class="space-y-4 rounded-xl border border-default p-4"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-default">
            {{ $t('auth.familyRegister.parent2') }}
          </h3>
          <UButton
            :label="$t('auth.familyRegister.removeParent2')"
            icon="i-lucide-x"
            size="xs"
            color="error"
            variant="ghost"
            @click="hasParent2 = false"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            :label="$t('auth.name')"
            :error="errors['parent2.name']"
          >
            <UInput
              v-model="parent2.name"
              size="xl"
              class="w-full"
            />
          </UFormField>
          <UFormField
            :label="$t('auth.surname')"
            :error="errors['parent2.surname']"
          >
            <UInput
              v-model="parent2.surname"
              size="xl"
              class="w-full"
            />
          </UFormField>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            :label="$t('auth.phone')"
            :error="errors['parent2.phone']"
          >
            <UInput
              v-model="parent2.phone"
              type="tel"
              placeholder="+7 XXX XXX XX XX"
              icon="i-lucide-phone"
              size="xl"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Email"
            :error="errors['parent2.email']"
          >
            <UInput
              v-model="parent2.email"
              type="email"
              icon="i-lucide-mail"
              size="xl"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <UButton
        :label="$t('common.next')"
        color="primary"
        size="xl"
        block
        trailing-icon="i-lucide-arrow-right"
        @click="nextFromStep1"
      />
    </div>

    <!-- Step 2: children -->
    <div
      v-else-if="step === 2"
      class="flex flex-col gap-5"
    >
      <div
        v-for="(child, i) in children"
        :key="i"
        class="space-y-4 rounded-xl border border-default p-4"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-default">
            {{ $t('auth.familyRegister.children') }} #{{ i + 1 }}
          </h3>
          <UButton
            v-if="children.length > 1"
            :label="$t('auth.familyRegister.removeChild')"
            icon="i-lucide-x"
            size="xs"
            color="error"
            variant="ghost"
            @click="removeChild(i)"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            :label="$t('auth.familyRegister.childName')"
            :error="errors[`child${i}.name`]"
          >
            <UInput
              v-model="child.name"
              size="xl"
              class="w-full"
            />
          </UFormField>
          <UFormField
            :label="$t('auth.familyRegister.childSurname')"
            :error="errors[`child${i}.surname`]"
          >
            <UInput
              v-model="child.surname"
              size="xl"
              class="w-full"
            />
          </UFormField>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UFormField :label="$t('auth.familyRegister.childAge')">
            <UInput
              v-model.number="child.age"
              type="number"
              :min="3"
              :max="18"
              size="xl"
              class="w-full"
            />
          </UFormField>
          <UFormField :label="$t('auth.familyRegister.childGrade')">
            <USelectMenu
              v-model="child.schoolGrade"
              :items="gradeOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField
            :label="$t('auth.familyRegister.childSchool')"
            class="col-span-3 sm:col-span-1"
          >
            <UInput
              v-model="child.schoolName"
              size="xl"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <UButton
        :label="$t('auth.familyRegister.addChild')"
        icon="i-lucide-plus"
        color="neutral"
        variant="subtle"
        :disabled="children.length >= 6"
        @click="addChild"
      />

      <div class="flex gap-3">
        <UButton
          :label="$t('common.back')"
          color="neutral"
          variant="subtle"
          size="xl"
          icon="i-lucide-arrow-left"
          @click="step = 1"
        />
        <UButton
          :label="$t('common.next')"
          color="primary"
          size="xl"
          class="flex-1"
          trailing-icon="i-lucide-arrow-right"
          @click="nextFromStep2"
        />
      </div>
    </div>

    <!-- Step 3: review -->
    <div
      v-else
      class="flex flex-col gap-5"
    >
      <div class="space-y-3 rounded-xl border border-default p-4">
        <h3 class="text-sm font-semibold text-default">
          {{ $t('auth.familyRegister.parent1') }}
        </h3>
        <p class="text-sm text-muted">
          {{ parent1.surname }} {{ parent1.name }} · {{ parent1.phone }} · {{ parent1.email }}
        </p>
        <template v-if="hasParent2">
          <h3 class="text-sm font-semibold text-default">
            {{ $t('auth.familyRegister.parent2') }}
          </h3>
          <p class="text-sm text-muted">
            {{ parent2.surname }} {{ parent2.name }} · {{ parent2.phone }} · {{ parent2.email }}
          </p>
        </template>
      </div>

      <div class="space-y-3 rounded-xl border border-default p-4">
        <h3 class="text-sm font-semibold text-default">
          {{ $t('auth.familyRegister.children') }}
        </h3>
        <div
          v-for="(child, i) in children"
          :key="i"
          class="text-sm text-muted"
        >
          {{ child.surname }} {{ child.name }}
          <span v-if="child.age">· {{ child.age }} лет</span>
          <span v-if="child.schoolGrade">· {{ child.schoolGrade }} класс</span>
          <span v-if="child.schoolName">· {{ child.schoolName }}</span>
        </div>
      </div>

      <UAlert
        color="info"
        variant="subtle"
        icon="i-lucide-info"
        :title="$t('auth.familyRegister.reviewNote')"
      />

      <div class="flex gap-3">
        <UButton
          :label="$t('common.back')"
          color="neutral"
          variant="subtle"
          size="xl"
          icon="i-lucide-arrow-left"
          :disabled="loading"
          @click="step = 2"
        />
        <UButton
          :label="loading ? $t('auth.familyRegister.submitting') : $t('auth.familyRegister.submit')"
          color="primary"
          size="xl"
          class="flex-1"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </div>

    <p class="mt-8 text-center text-sm text-muted">
      {{ $t('auth.hasAccount') }}
      <NuxtLink
        to="/login"
        class="font-semibold text-primary hover:underline"
      >
        {{ $t('auth.login') }}
      </NuxtLink>
    </p>

    <CredentialsModal
      v-if="registrationResult"
      :open="showCredentials"
      :accounts="registrationResult.accounts"
      @update:open="v => showCredentials = v"
    />
  </div>
</template>
