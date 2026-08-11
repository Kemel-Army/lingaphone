<script setup lang="ts">
type MascotState
  = | 'welcome'
    | 'platform-guide'
    | 'method-teacher'
    | 'progress-analyst'
    | 'celebrate'
    | 'encourage'
    | 'plan-helper'
    | 'onboarding-guide'
    | 'faq-curious'
    | 'trial-invite'

const props = withDefaults(defineProps<{
  state: MascotState
  size?: 'xs' | 'sm' | 'md' | 'lg'
  label?: string
  alt?: string
  loading?: 'eager' | 'lazy'
  mirror?: boolean
}>(), {
  size: 'md',
  label: '',
  alt: '',
  loading: 'lazy',
  mirror: false
})

const stateFiles: Record<MascotState, string> = {
  'welcome': '01-welcome-transparent.webp',
  'platform-guide': '02-platform-guide-transparent.webp',
  'method-teacher': '03-method-teacher-transparent.webp',
  'progress-analyst': '04-progress-analyst-transparent.webp',
  'celebrate': '05-celebrate-transparent.webp',
  'encourage': '06-encourage-transparent.webp',
  'plan-helper': '07-plan-helper-transparent.webp',
  'onboarding-guide': '08-onboarding-guide-transparent.webp',
  'faq-curious': '09-faq-curious-transparent.webp',
  'trial-invite': '10-trial-invite-transparent.webp'
}

const source = computed(() => `/images/brand/mascot-states/${stateFiles[props.state]}`)
</script>

<template>
  <figure
    class="mascot-moment"
    :class="[`mascot-moment--${size}`, { 'mascot-moment--mirror': mirror }]"
  >
    <span aria-hidden="true" />
    <img
      :src="source"
      :alt="alt"
      :loading="loading"
      width="640"
      height="824"
    >
    <figcaption v-if="label">
      {{ label }}
    </figcaption>
  </figure>
</template>

<style scoped>
.mascot-moment {
  --mascot-size: 190px;
  position: relative;
  isolation: isolate;
  width: var(--mascot-size);
  margin: 0;
}
.mascot-moment--xs { --mascot-size: 96px; }
.mascot-moment--sm { --mascot-size: 140px; }
.mascot-moment--lg { --mascot-size: 290px; }
.mascot-moment > span {
  position: absolute;
  z-index: -1;
  inset: 19% 5% 4%;
  border-radius: 48% 52% 50% 50%;
  background: radial-gradient(circle at 45% 35%, rgb(255 255 255 / 90%), rgb(198 235 251 / 68%) 48%, transparent 72%);
  filter: blur(3px);
}
.mascot-moment img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 18px 18px rgb(18 59 99 / 20%));
  transform: scaleX(var(--mascot-direction, 1));
}
.mascot-moment--mirror { --mascot-direction: -1; }
.mascot-moment figcaption {
  position: absolute;
  z-index: 2;
  top: 15%;
  left: 72%;
  width: max-content;
  max-width: 180px;
  padding: 8px 11px;
  border: 1px solid rgb(216 234 245 / 90%);
  border-radius: 12px 12px 12px 3px;
  background: rgb(255 255 255 / 94%);
  color: #123b63;
  box-shadow: 0 12px 30px rgb(18 59 99 / 16%);
  font-size: 10px;
  font-weight: 800;
  line-height: 1.3;
}
</style>
