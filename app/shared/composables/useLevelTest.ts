/**
 * useLevelTest — driver for the public English-level placement test.
 *
 * Stratified sampling: 10 random questions per tier (A1, A2, S1, S2, F1)
 * → 50 questions total, shuffled, so order doesn't telegraph difficulty.
 *
 * Level determination (CEFR-ish):
 *   Walk tiers from A1 upward. Result = highest contiguous tier where score
 *   ≥ TIER_PASS_THRESHOLD. Below A1 threshold → PRE_A1.
 *
 * Pure-client: no DB, no auth — intended as a landing-page lead magnet.
 */
import { LEVEL_TEST_POOL, LEVEL_TEST_TIERS, type LevelTestQuestion, type LevelTestTier } from '~/shared/mock'

export type LevelResult = LevelTestTier | 'PRE_A1'

const QUESTIONS_PER_TIER = 10
const TIER_PASS_THRESHOLD = 6 // 60% of 10

/** Pure Fisher-Yates shuffle then take first N. */
const sample = <T>(arr: readonly T[], n: number): T[] => {
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = tmp
  }
  return copy.slice(0, Math.min(n, copy.length))
}

const shuffle = <T>(arr: readonly T[]): T[] => sample(arr, arr.length)

export interface AnswerRecord {
  questionId: string
  level: LevelTestTier
  given: number
  correct: boolean
}

export interface LevelTestSummary {
  level: LevelResult
  totalCorrect: number
  totalQuestions: number
  perTier: Record<LevelTestTier, { correct: number, total: number }>
}

const LEVEL_LABEL: Record<LevelResult, string> = {
  PRE_A1: 'Pre-A1 · Только начинаешь',
  A1: 'A1 · Starter',
  A2: 'A2 · Elementary',
  S1: 'B1 · Pre-Intermediate',
  S2: 'B2 · Upper-Intermediate',
  F1: 'C1 · Advanced'
}

const LEVEL_DESCRIPTION: Record<LevelResult, string> = {
  PRE_A1: 'Узнаёшь отдельные слова, но фразы пока сложны. Самое время начать — с правильной программой ты быстро пойдёшь дальше.',
  A1: 'Понимаешь и используешь базовые фразы для знакомства, времени, цен. Можешь представиться и ответить на простые вопросы.',
  A2: 'Справляешься с повседневными ситуациями — кафе, магазин, расписание. Понимаешь короткие тексты и можешь рассказать о себе.',
  S1: 'Можешь общаться в большинстве ситуаций в поездке, поддерживать разговор и описывать опыт, надежды и планы.',
  S2: 'Понимаешь сложные тексты, говоришь бегло и спонтанно с носителями. Можешь обсуждать абстрактные темы.',
  F1: 'Свободно владеешь языком в профессиональной и академической среде. Понимаешь подтекст, читаешь между строк.'
}

const LEVEL_CTA: Record<LevelResult, string> = {
  PRE_A1: 'Начни с A1 — за 3-4 месяца выйдешь на бытовое общение',
  A1: 'Запишись в группу A1 → A2 — закроешь базу и пойдёшь дальше',
  A2: 'Группа A2 → B1 готовит к свободному общению — самое время',
  S1: 'B1 → B2 — выводим к свободной речи и сертификатам',
  S2: 'B2 → C1 — финальная шлифовка для IELTS/CAE',
  F1: 'Поддержание уровня и подготовка к C2 / профессиональным сертификатам'
}

export const useLevelTest = () => {
  const sampleStratified = (): LevelTestQuestion[] => {
    const result: LevelTestQuestion[] = []
    for (const tier of LEVEL_TEST_TIERS) {
      const tierPool = LEVEL_TEST_POOL.filter(q => q.level === tier)
      result.push(...sample(tierPool, QUESTIONS_PER_TIER))
    }
    return shuffle(result)
  }

  const determineLevel = (answers: AnswerRecord[]): LevelResult => {
    const perTier = {} as Record<LevelTestTier, number>
    for (const t of LEVEL_TEST_TIERS) perTier[t] = 0
    for (const a of answers) {
      if (a.correct) perTier[a.level]++
    }

    // Climb tiers — last one to pass threshold is the result.
    // If A1 doesn't pass → PRE_A1.
    let result: LevelResult = 'PRE_A1'
    for (const t of LEVEL_TEST_TIERS) {
      if (perTier[t] >= TIER_PASS_THRESHOLD) {
        result = t
      } else {
        break
      }
    }
    return result
  }

  const summarize = (answers: AnswerRecord[]): LevelTestSummary => {
    const perTier = {} as Record<LevelTestTier, { correct: number, total: number }>
    for (const t of LEVEL_TEST_TIERS) {
      perTier[t] = { correct: 0, total: 0 }
    }
    for (const a of answers) {
      perTier[a.level].total++
      if (a.correct) perTier[a.level].correct++
    }
    return {
      level: determineLevel(answers),
      totalCorrect: answers.filter(a => a.correct).length,
      totalQuestions: answers.length,
      perTier
    }
  }

  return {
    TOTAL_QUESTIONS: QUESTIONS_PER_TIER * LEVEL_TEST_TIERS.length,
    QUESTIONS_PER_TIER,
    TIER_PASS_THRESHOLD,
    LEVEL_LABEL,
    LEVEL_DESCRIPTION,
    LEVEL_CTA,
    sampleStratified,
    determineLevel,
    summarize
  }
}
