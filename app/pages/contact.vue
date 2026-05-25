<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'landing' })
useHead({ title: t('pages.contact') })
useSeoMeta({ description: t('legal.contact.seoDesc') })

const toast = useAppToast()

const form = reactive({
  name: '',
  email: '',
  message: ''
})
const isSending = ref(false)

const handleSubmit = async () => {
  if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
    toast.error(t('common.error'), t('legal.contact.fillAllFields'))
    return
  }
  isSending.value = true
  try {
    await $fetch('/api/notifications/contact', {
      method: 'POST',
      body: { name: form.name, email: form.email, message: form.message }
    })
    toast.success(t('legal.contact.sent'), t('legal.contact.sentDesc'))
    form.name = ''
    form.email = ''
    form.message = ''
  } catch {
    toast.error(t('common.error'), t('legal.contact.sendError'))
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <UContainer class="py-16">
    <div class="mx-auto max-w-2xl space-y-8">
      <h1 class="text-4xl font-bold">
        {{ $t('legal.contact.title') }}
      </h1>

      <div class="grid gap-6 sm:grid-cols-2">
        <UCard>
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-mail"
              class="mt-0.5 size-5 text-primary"
            />
            <div>
              <h3 class="font-semibold">
                {{ $t('legal.contact.email') }}
              </h3>
              <p class="text-sm text-muted">
                info@Lingaphone.kz
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-phone"
              class="mt-0.5 size-5 text-primary"
            />
            <div>
              <h3 class="font-semibold">
                {{ $t('legal.contact.phone') }}
              </h3>
              <p class="text-sm text-muted">
                +7 (777) 000-00-00
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-map-pin"
              class="mt-0.5 size-5 text-primary"
            />
            <div>
              <h3 class="font-semibold">
                {{ $t('legal.contact.address') }}
              </h3>
              <p class="text-sm text-muted">
                Казахстан, г. Алматы
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-send"
              class="mt-0.5 size-5 text-primary"
            />
            <div>
              <h3 class="font-semibold">
                {{ $t('legal.contact.telegram') }}
              </h3>
              <p class="text-sm text-muted">
                @femo_platform
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h3 class="font-semibold">
            {{ $t('legal.contact.writeUs') }}
          </h3>
        </template>
        <form
          class="flex flex-col gap-4"
          @submit.prevent="handleSubmit"
        >
          <UFormField :label="$t('legal.contact.name')">
            <UInput
              v-model="form.name"
              :placeholder="$t('legal.contact.name')"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Email">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="name@example.com"
              class="w-full"
            />
          </UFormField>
          <UFormField :label="$t('legal.contact.message')">
            <UTextarea
              v-model="form.message"
              :placeholder="$t('legal.contact.messagePlaceholder')"
              :rows="4"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            :label="$t('legal.contact.send')"
            color="primary"
            :loading="isSending"
          />
        </form>
      </UCard>
    </div>
  </UContainer>
</template>
