// Public API для библиотеки intuition-виджетов.
// Каждый виджет получает props.config — соответствующий вариант
// IntuitionWidget из ~/entities/learning-path.
//
// Реализованные:
//   - place-value-blocks → PlaceValueBlocksWidget
//   - clock              → ClockWidget
//   - balance-scale      → BalanceScaleWidget
//   - number-line        → NumberLineWidget
//   - grouping           → GroupingWidget
//   - set-venn           → SetVennWidget
//   - angle-protractor   → AngleProtractorWidget
//
// Inline (legacy, в IntuitionLayer.vue):
//   - array-grid
//
// Не реализованы (есть в типах, fallback показывает предупреждение):
//   - fraction-trio, ruler, coin-counter, share-equally

// Language widgets (English)
export { default as WordPictureMatchWidget } from './WordPictureMatchWidget.vue'
export { default as SentenceBuilderWidget } from './SentenceBuilderWidget.vue'
export { default as ListenAndPickWidget } from './ListenAndPickWidget.vue'
export { default as GapFillWidget } from './GapFillWidget.vue'

// Math manipulatives (ported from arna)
export { default as PlaceValueBlocksWidget } from './PlaceValueBlocksWidget.vue'
export { default as ClockWidget } from './ClockWidget.vue'
export { default as BalanceScaleWidget } from './BalanceScaleWidget.vue'
export { default as NumberLineWidget } from './NumberLineWidget.vue'
export { default as GroupingWidget } from './GroupingWidget.vue'
export { default as SetVennWidget } from './SetVennWidget.vue'
export { default as AngleProtractorWidget } from './AngleProtractorWidget.vue'
