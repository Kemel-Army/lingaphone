<script setup lang="ts">
import { AvatarCharacter, useAvatar, EMOTES, type AvatarEmotion } from '~/entities/avatar'

definePageMeta({ layout: 'dashboard' })

const { fetchState } = useAvatar()
const { data: state } = await useAsyncData('student-avatar', fetchState)
const config = computed(() => state.value?.config ?? undefined)

const emote = ref<string | null>(null)
const emotion = ref<AvatarEmotion>('neutral')
let emoteTimer: ReturnType<typeof setTimeout> | undefined

const playEmote = (id: string) => {
  emote.value = null
  // next tick restart animation
  requestAnimationFrame(() => {
    emote.value = id
    emotion.value = id === 'dance' || id === 'wave' ? 'joy' : 'laughter'
  })
  clearTimeout(emoteTimer)
  emoteTimer = setTimeout(() => {
    emote.value = null
    emotion.value = 'neutral'
  }, 900)
}
onBeforeUnmount(() => clearTimeout(emoteTimer))
</script>

<template>
  <div class="p-4 sm:p-6 max-w-3xl mx-auto">
    <div class="text-center mb-4">
      <h1 class="text-2xl font-black tracking-tight">
        Мой персонаж
      </h1>
      <p class="text-sm text-muted mt-0.5">
        Наведи на персонажа и выбери эмоцию
      </p>
    </div>

    <!-- Stage -->
    <div class="relative rounded-3xl bg-linear-to-b from-sky-100 to-emerald-100 dark:from-slate-800 dark:to-slate-900 p-6 group overflow-hidden">
      <div class="absolute inset-x-0 top-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <UButton
          v-for="e in EMOTES"
          :key="e.id"
          :icon="e.icon"
          size="sm"
          color="neutral"
          variant="solid"
          :title="e.label"
          @click="playEmote(e.id)"
        />
      </div>

      <div
        v-if="config"
        class="mx-auto w-56 h-72 cursor-pointer"
        @click="playEmote('jump')"
      >
        <AvatarCharacter
          :config="config"
          :emotion="emotion"
          :emote="emote"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="grid grid-cols-2 gap-3 mt-4">
      <UButton
        to="/student/avatar/customize"
        icon="i-lucide-shirt"
        size="lg"
        block
      >
        Кастомизация
      </UButton>
      <UButton
        to="/student/avatar/play"
        icon="i-lucide-gamepad-2"
        size="lg"
        color="neutral"
        variant="soft"
        block
      >
        Поиграть
      </UButton>
    </div>
  </div>
</template>
