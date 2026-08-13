/**
 * Подсказка для двухшаговых упражнений («соедини пару», «распредели по
 * колонкам», «слово к картинке»).
 *
 * В них цель (правая колонка / колонка-корзина / картинка) не реагирует, пока
 * не выбран источник. Тап при этом не делал ровно ничего — и читался как
 * «кнопка не кликается». Хелпер даёт общий флаг, который компонент показывает
 * текстом и снимает сам через пару секунд.
 */
export const useArmHint = (delayMs = 1800) => {
  const hint = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const show = () => {
    hint.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      hint.value = false
      timer = null
    }, delayMs)
  }

  onScopeDispose(() => {
    if (timer) clearTimeout(timer)
  })

  return { hint, show }
}
