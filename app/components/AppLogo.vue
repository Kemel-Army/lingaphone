<template>
  <svg
    width="860"
    height="120"
    viewBox="0 0 860 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Lingaphone"
  >
    <!-- Globe with headphones icon -->
    <g transform="translate(0, 8)">
      <!-- Globe circle -->
      <circle
        cx="52"
        cy="52"
        r="46"
        stroke="var(--ui-primary)"
        stroke-width="5"
        fill="none"
      />
      <!-- Globe meridian (vertical) -->
      <ellipse
        cx="52"
        cy="52"
        rx="22"
        ry="46"
        stroke="var(--ui-primary)"
        stroke-width="3.5"
        fill="none"
      />
      <!-- Globe latitude line -->
      <line
        x1="6"
        y1="52"
        x2="98"
        y2="52"
        stroke="var(--ui-primary)"
        stroke-width="3.5"
      />
      <!-- Globe latitude line top -->
      <path
        d="M14 30 Q52 20 90 30"
        stroke="var(--ui-primary)"
        stroke-width="3"
        fill="none"
      />
      <!-- Globe latitude line bottom -->
      <path
        d="M14 74 Q52 84 90 74"
        stroke="var(--ui-primary)"
        stroke-width="3"
        fill="none"
      />
      <!-- Headphone left cup -->
      <path
        d="M8 52 C8 28 28 8 52 8 C76 8 96 28 96 52"
        stroke="currentColor"
        stroke-width="5.5"
        fill="none"
        stroke-linecap="round"
      />
      <rect
        x="2"
        y="48"
        width="14"
        height="22"
        rx="7"
        fill="var(--ui-primary)"
      />
      <!-- Headphone right cup -->
      <rect
        x="88"
        y="48"
        width="14"
        height="22"
        rx="7"
        fill="var(--ui-primary)"
      />
    </g>
    <!-- "Lingaphone" text -->
    <!-- L -->
    <text
      x="128"
      y="90"
      font-family="'Manrope', 'Inter', sans-serif"
      font-weight="800"
      font-size="72"
      fill="var(--ui-primary)"
    >L</text>
    <!-- ingaphone -->
    <text
      x="175"
      y="90"
      font-family="'Manrope', 'Inter', sans-serif"
      font-weight="800"
      font-size="72"
      fill="currentColor"
    >ingaphone</text>
  </svg>
</template>
