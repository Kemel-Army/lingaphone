/**
 * Reactive Chart.js color palette that adapts to light/dark mode.
 */
export const useChartColors = () => {
  const colorMode = useColorMode()

  const colors = computed(() => {
    const isDark = colorMode.value === 'dark'

    return {
      primary: isDark ? '#4ADE80' : '#16A34A',
      primarySoft: isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(22, 163, 74, 0.15)',
      success: isDark ? '#4ADE80' : '#16A34A',
      successSoft: isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(22, 163, 74, 0.15)',
      warning: isDark ? '#FBBF24' : '#D97706',
      warningSoft: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(217, 119, 6, 0.15)',
      error: isDark ? '#F87171' : '#DC2626',
      errorSoft: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(220, 38, 38, 0.15)',
      info: isDark ? '#60A5FA' : '#2563EB',
      infoSoft: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.15)',
      xp: isDark ? '#FBBF24' : '#D97706',
      streak: isDark ? '#FB923C' : '#EA580C',
      badge: isDark ? '#2DD4BF' : '#0D9488',
      level: isDark ? '#A78BFA' : '#7C3AED',
      text: isDark ? '#D6D3D1' : '#44403C',
      textMuted: isDark ? '#A8A29E' : '#8C857E',
      border: isDark ? '#57534E' : '#E5E0D8',
      grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    }
  })

  /** Ordered palette for multi-series charts */
  const palette = computed(() => [
    colors.value.primary,
    colors.value.info,
    colors.value.warning,
    colors.value.error,
    colors.value.badge,
    colors.value.level
  ])

  return { colors, palette }
}
