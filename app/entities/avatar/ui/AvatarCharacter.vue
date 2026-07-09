<script setup lang="ts">
import type { AvatarConfig, AvatarEmotion } from '~/shared/lib/avatarCatalog'

const props = withDefaults(defineProps<{
  config: AvatarConfig
  emotion?: AvatarEmotion
  emote?: string | null
}>(), {
  emotion: 'neutral',
  emote: null
})

// Цвет одежды зависит от выбранного топа (костюм тёмный, худи серое и т.п.).
const topColor = computed(() => {
  switch (props.config.top) {
    case 'top-hoodie': return '#64748b'
    case 'top-suit': return '#1e293b'
    case 'top-stripes': return '#ffffff'
    default: return props.config.color
  }
})
const shoeColor = computed(() => {
  switch (props.config.shoes) {
    case 'shoes-boots': return '#78350f'
    case 'shoes-neon': return '#22d3ee'
    default: return '#ef4444'
  }
})
</script>

<template>
  <div
    class="avatar-root select-none"
    :class="emote ? `emote-${emote}` : ''"
  >
    <svg
      viewBox="0 0 200 260"
      class="w-full h-full overflow-visible"
    >
      <!-- shadow -->
      <ellipse
        cx="100"
        cy="248"
        rx="48"
        ry="9"
        fill="rgba(0,0,0,0.15)"
        class="shadow"
      />

      <!-- legs -->
      <rect
        x="84"
        y="188"
        width="13"
        height="46"
        rx="6"
        fill="#334155"
      />
      <rect
        x="103"
        y="188"
        width="13"
        height="46"
        rx="6"
        fill="#334155"
      />
      <!-- shoes -->
      <g :fill="shoeColor">
        <rect
          x="78"
          y="228"
          width="22"
          height="14"
          rx="7"
        />
        <rect
          x="100"
          y="228"
          width="22"
          height="14"
          rx="7"
        />
        <g v-if="config.shoes === 'shoes-neon'">
          <rect
            x="78"
            y="236"
            width="22"
            height="4"
            fill="#a3e635"
          />
          <rect
            x="100"
            y="236"
            width="22"
            height="4"
            fill="#a3e635"
          />
        </g>
      </g>

      <!-- body / top -->
      <path
        d="M64 130 Q100 118 136 130 L142 196 Q100 208 58 196 Z"
        :fill="topColor"
        :stroke="config.top === 'top-stripes' ? '#1e3a8a' : 'none'"
      />
      <template v-if="config.top === 'top-stripes'">
        <rect
          x="60"
          y="144"
          width="80"
          height="7"
          fill="#1e3a8a"
        />
        <rect
          x="58"
          y="162"
          width="84"
          height="7"
          fill="#1e3a8a"
        />
        <rect
          x="58"
          y="180"
          width="84"
          height="7"
          fill="#1e3a8a"
        />
      </template>
      <path
        v-if="config.top === 'top-suit'"
        d="M100 130 L100 196 M88 130 L100 150 L112 130"
        stroke="#f8fafc"
        stroke-width="3"
        fill="none"
      />
      <path
        v-if="config.top === 'top-hoodie'"
        d="M78 128 Q100 140 122 128 L122 138 Q100 150 78 138 Z"
        fill="#475569"
      />

      <!-- arms -->
      <g class="arm arm-left">
        <rect
          x="50"
          y="132"
          width="14"
          height="46"
          rx="7"
          :fill="topColor"
        />
        <circle
          cx="57"
          cy="180"
          r="8"
          fill="#f6c99a"
        />
      </g>
      <g class="arm arm-right">
        <rect
          x="136"
          y="132"
          width="14"
          height="46"
          rx="7"
          :fill="topColor"
        />
        <circle
          cx="143"
          cy="180"
          r="8"
          fill="#f6c99a"
        />
      </g>

      <!-- head -->
      <circle
        cx="100"
        cy="88"
        r="42"
        fill="#f6c99a"
      />
      <!-- ears -->
      <circle
        cx="60"
        cy="88"
        r="8"
        fill="#f6c99a"
      />
      <circle
        cx="140"
        cy="88"
        r="8"
        fill="#f6c99a"
      />

      <!-- ─── EYES by emotion ─── -->
      <g fill="#1f2937">
        <template v-if="emotion === 'laughter'">
          <path
            d="M76 84 Q84 76 92 84"
            stroke="#1f2937"
            stroke-width="3"
            fill="none"
            stroke-linecap="round"
          />
          <path
            d="M108 84 Q116 76 124 84"
            stroke="#1f2937"
            stroke-width="3"
            fill="none"
            stroke-linecap="round"
          />
        </template>
        <template v-else-if="emotion === 'joy'">
          <path
            d="M76 86 Q84 78 92 86"
            stroke="#1f2937"
            stroke-width="3"
            fill="none"
            stroke-linecap="round"
          />
          <path
            d="M108 86 Q116 78 124 86"
            stroke="#1f2937"
            stroke-width="3"
            fill="none"
            stroke-linecap="round"
          />
        </template>
        <template v-else-if="emotion === 'surprise' || emotion === 'fear'">
          <circle
            cx="84"
            cy="84"
            r="8"
            fill="#fff"
            stroke="#1f2937"
            stroke-width="2"
          />
          <circle
            cx="116"
            cy="84"
            r="8"
            fill="#fff"
            stroke="#1f2937"
            stroke-width="2"
          />
          <circle
            cx="84"
            cy="85"
            r="3.5"
          />
          <circle
            cx="116"
            cy="85"
            r="3.5"
          />
        </template>
        <template v-else-if="emotion === 'annoyance'">
          <line
            x1="76"
            y1="76"
            x2="92"
            y2="80"
            stroke="#1f2937"
            stroke-width="3"
            stroke-linecap="round"
          />
          <line
            x1="124"
            y1="76"
            x2="108"
            y2="80"
            stroke="#1f2937"
            stroke-width="3"
            stroke-linecap="round"
          />
          <circle
            cx="84"
            cy="86"
            r="4"
          />
          <circle
            cx="116"
            cy="86"
            r="4"
          />
        </template>
        <template v-else>
          <circle
            cx="84"
            cy="85"
            r="5"
          />
          <circle
            cx="116"
            cy="85"
            r="5"
          />
          <circle
            cx="86"
            cy="83"
            r="1.6"
            fill="#fff"
          />
          <circle
            cx="118"
            cy="83"
            r="1.6"
            fill="#fff"
          />
        </template>
      </g>

      <!-- cheeks -->
      <circle
        cx="72"
        cy="100"
        r="6"
        fill="#fca5a5"
        opacity="0.6"
      />
      <circle
        cx="128"
        cy="100"
        r="6"
        fill="#fca5a5"
        opacity="0.6"
      />

      <!-- ─── MOUTH by emotion ─── -->
      <g
        fill="none"
        stroke="#1f2937"
        stroke-width="3"
        stroke-linecap="round"
      >
        <path
          v-if="emotion === 'joy'"
          d="M84 104 Q100 120 116 104"
        />
        <path
          v-else-if="emotion === 'laughter'"
          d="M82 102 Q100 124 118 102 Z"
          fill="#be123c"
          stroke="none"
        />
        <ellipse
          v-else-if="emotion === 'surprise'"
          cx="100"
          cy="108"
          rx="7"
          ry="9"
          fill="#be123c"
          stroke="none"
        />
        <path
          v-else-if="emotion === 'fear'"
          d="M88 108 Q94 102 100 108 Q106 114 112 108"
        />
        <line
          v-else-if="emotion === 'annoyance'"
          x1="86"
          y1="110"
          x2="114"
          y2="110"
        />
        <path
          v-else
          d="M86 106 Q100 116 114 106"
        />
      </g>

      <!-- fear sweat drop -->
      <path
        v-if="emotion === 'fear'"
        d="M136 70 q5 8 0 12 q-5 -4 0 -12"
        fill="#38bdf8"
      />

      <!-- ─── GLASSES ─── -->
      <g
        v-if="config.glasses !== 'glasses-none'"
        fill="none"
        stroke="#1f2937"
        stroke-width="3"
      >
        <template v-if="config.glasses === 'glasses-round'">
          <circle
            cx="84"
            cy="85"
            r="12"
          />
          <circle
            cx="116"
            cy="85"
            r="12"
          />
          <line
            x1="96"
            y1="85"
            x2="104"
            y2="85"
          />
        </template>
        <template v-else-if="config.glasses === 'glasses-sun'">
          <rect
            x="72"
            y="76"
            width="24"
            height="16"
            rx="4"
            fill="#111827"
          />
          <rect
            x="104"
            y="76"
            width="24"
            height="16"
            rx="4"
            fill="#111827"
          />
          <line
            x1="96"
            y1="80"
            x2="104"
            y2="80"
          />
        </template>
        <template v-else-if="config.glasses === 'glasses-star'">
          <text
            x="74"
            y="92"
            font-size="20"
            stroke="none"
            fill="#f59e0b"
          >★</text>
          <text
            x="106"
            y="92"
            font-size="20"
            stroke="none"
            fill="#f59e0b"
          >★</text>
        </template>
      </g>

      <!-- ─── HAT ─── -->
      <g v-if="config.hat !== 'hat-none'">
        <template v-if="config.hat === 'hat-cap'">
          <path
            d="M64 56 Q100 34 136 56 L136 62 L64 62 Z"
            fill="#ef4444"
          />
          <path
            d="M100 62 Q150 60 156 70 L100 70 Z"
            fill="#dc2626"
          />
        </template>
        <template v-else-if="config.hat === 'hat-beanie'">
          <path
            d="M62 60 Q100 24 138 60 Z"
            fill="#8b5cf6"
          />
          <rect
            x="60"
            y="56"
            width="80"
            height="10"
            rx="5"
            fill="#7c3aed"
          />
        </template>
        <template v-else-if="config.hat === 'hat-wizard'">
          <path
            d="M100 6 L128 62 L72 62 Z"
            fill="#4c1d95"
          />
          <text
            x="92"
            y="46"
            font-size="16"
            fill="#fde047"
          >✦</text>
          <rect
            x="66"
            y="60"
            width="68"
            height="8"
            rx="4"
            fill="#6d28d9"
          />
        </template>
        <template v-else-if="config.hat === 'hat-crown'">
          <path
            d="M68 58 L74 34 L88 52 L100 30 L112 52 L126 34 L132 58 Z"
            fill="#f59e0b"
            stroke="#d97706"
            stroke-width="2"
          />
          <circle
            cx="100"
            cy="44"
            r="3"
            fill="#ef4444"
          />
          <circle
            cx="80"
            cy="48"
            r="2.5"
            fill="#3b82f6"
          />
          <circle
            cx="120"
            cy="48"
            r="2.5"
            fill="#10b981"
          />
        </template>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.avatar-root {
  transform-origin: 50% 90%;
}
.avatar-root svg { animation: idle 3s ease-in-out infinite; }
@keyframes idle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-4px) rotate(-0.5deg); }
}

/* Emotes override idle */
.emote-jump svg { animation: emote-jump 0.6s ease; }
.emote-dance svg { animation: emote-dance 0.8s ease; }
.emote-spin svg { animation: emote-spin 0.7s ease; }
.emote-wave .arm-right { animation: emote-wave 0.7s ease; transform-origin: 143px 132px; }

@keyframes emote-jump {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-40px); }
  60% { transform: translateY(-30px); }
}
@keyframes emote-dance {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(8deg) translateX(6px); }
  75% { transform: rotate(-8deg) translateX(-6px); }
}
@keyframes emote-spin {
  from { transform: rotateY(0deg); }
  to { transform: rotateY(360deg); }
}
@keyframes emote-wave {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-40deg); }
}
</style>
