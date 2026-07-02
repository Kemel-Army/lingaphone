<script setup lang="ts">
import type { IntroBlock } from '~/entities/book'

defineProps<{ title: string, subtitle?: string | null, intro: IntroBlock[] }>()
const isUrl = (s?: string) => !!s && /^(https?:|\/)/.test(s)
</script>

<template>
  <div class="flex flex-col items-center gap-5 text-center">
    <FemiMascot
      state="teach"
      size="lg"
    />
    <div>
      <h1 class="text-2xl font-black tracking-tight sm:text-3xl">
        {{ title }}
      </h1>
      <p
        v-if="subtitle"
        class="mt-1 text-sm text-muted"
      >
        {{ subtitle }}
      </p>
    </div>

    <div class="flex w-full flex-col gap-3 text-left">
      <template
        v-for="(b, i) in intro"
        :key="i"
      >
        <p
          v-if="b.type === 'text'"
          class="text-base leading-relaxed"
        >
          {{ b.text }}
        </p>

        <div
          v-else-if="b.type === 'rule'"
          class="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4"
        >
          <div class="flex items-start gap-2">
            <UIcon
              name="i-lucide-lightbulb"
              class="mt-0.5 size-5 shrink-0 text-primary"
            />
            <p class="text-base font-semibold leading-relaxed">
              {{ b.text }}
            </p>
          </div>
        </div>

        <div
          v-else-if="b.type === 'examples'"
          class="flex flex-wrap gap-2"
        >
          <span
            v-for="(ex, j) in b.items"
            :key="j"
            class="rounded-xl bg-elevated px-3 py-1.5 text-sm font-semibold italic ring-1 ring-default"
          >{{ ex }}</span>
        </div>

        <div
          v-else-if="b.type === 'image'"
          class="flex justify-center"
        >
          <img
            v-if="isUrl(b.url)"
            :src="b.url"
            alt=""
            class="max-h-40 rounded-2xl object-contain"
          >
          <span
            v-else
            class="text-6xl"
          >{{ b.url }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
