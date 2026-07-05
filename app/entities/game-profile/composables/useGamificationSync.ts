import { useGameProfile } from './useGameProfile'

/**
 * useGamificationSync — оживляет источники кристаллов, которые иначе
 * никогда не срабатывают на клиенте.
 *
 * Бэкенд начисляет gems из четырёх мест:
 *   1. Level-up          — авто, внутри award_xp_atomic (уже работает).
 *   2. Достижения        — check-achievements (нужно вызвать).
 *   3. Серия дней        — update-streak (нужно вызвать).
 *   4. Квесты            — сначала generate-quests назначает StudentQuest,
 *                          дальше они тикаются авто-цепочкой из award-xp.
 *
 * Все три недостающих триггера дёргаем один раз за сессию при заходе
 * ученика на дашборд. Идемпотентность/дневная защита — на стороне сервера
 * (update-streak смотрит lastActiveDate, generate-quests — активные квесты,
 * check-achievements — уже выданные достижения), поэтому повторные вызовы
 * безопасны и ничего не дублируют.
 */

// Гард на уровне модуля: не спамим сервер при каждой навигации внутри SPA.
let syncedThisSession = false

export const useGamificationSync = () => {
  const { updateStreak, checkAndAwardAchievements } = useGameProfile()

  /**
   * Прогнать дневную синхронизацию геймификации. Best-effort: любая ошибка
   * гасится, чтобы не ломать загрузку дашборда.
   */
  const syncDaily = async (force = false) => {
    if (syncedThisSession && !force) return
    syncedThisSession = true

    // 1. Серия дней (+ gem-майлстоуны 7/14/30/60/100).
    try {
      await updateStreak('')
    } catch { /* best-effort */ }

    // 2. Назначить дневные/недельные квесты, если их ещё нет.
    try {
      await $fetch('/api/gamification/generate-quests', { method: 'POST' })
    } catch { /* best-effort */ }

    // 3. Выдать заработанные достижения (+ их gems).
    try {
      await checkAndAwardAchievements('')
    } catch { /* best-effort */ }
  }

  return { syncDaily }
}
