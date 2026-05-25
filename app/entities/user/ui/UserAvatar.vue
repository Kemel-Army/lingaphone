<script setup lang="ts">
/**
 * User avatar component — shows avatar image or initials fallback.
 *
 * Optional `frame` prop renders one of the cosmetic frames purchasable
 * in the gem shop. Frame styles match ShopItem.effect.style values seeded
 * in supabase/migrations/20260614000000_gamification_v2_gems_quests.sql.
 */
interface Props {
  src?: string | null
  name?: string
  surname?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  frame?: 'starry' | 'galactic' | 'blackhole' | null
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  name: '',
  surname: '',
  size: 'md',
  frame: null
})

const initials = computed(() => {
  const first = props.name?.charAt(0) ?? ''
  const last = props.surname?.charAt(0) ?? ''
  return `${first}${last}`.toUpperCase()
})

const sizeClasses: Record<string, string> = {
  'xs': 'size-6 text-[10px]',
  'sm': 'size-8 text-xs',
  'md': 'size-10 text-sm',
  'lg': 'size-12 text-base',
  'xl': 'size-16 text-lg',
  '2xl': 'size-20 text-xl',
  '3xl': 'size-24 text-2xl'
}
</script>

<template>
  <div
    :class="['femo-avatar-wrap', frame ? `femo-avatar-frame-${frame}` : '']"
  >
    <UAvatar
      v-if="src"
      :src="src ?? undefined"
      :alt="initials"
      :class="sizeClasses[size]"
    />
    <div
      v-else
      :class="[
        sizeClasses[size],
        'flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary'
      ]"
    >
      {{ initials }}
    </div>
  </div>
</template>

<style scoped>
.femo-avatar-wrap {
  position: relative;
  display: inline-flex;
  border-radius: 9999px;
}
.femo-avatar-wrap::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 9999px;
  pointer-events: none;
  z-index: 0;
}
.femo-avatar-wrap > :deep(*) { position: relative; z-index: 1; }

.femo-avatar-frame-starry::before {
  background: conic-gradient(from 0deg, #FACC15, #F472B6, #38BDF8, #FACC15);
  padding: 3px;
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
}
.femo-avatar-frame-galactic::before {
  background: conic-gradient(from 0deg, #A855F7, #3B82F6, #06B6D4, #A855F7);
  animation: femo-frame-spin 6s linear infinite;
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
}
.femo-avatar-frame-blackhole::before {
  background:
    radial-gradient(circle at center, #000 0%, #1F2937 60%, #EAB308 70%, #1F2937 100%);
  box-shadow: 0 0 12px rgba(234, 179, 8, 0.5);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
}
@keyframes femo-frame-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
