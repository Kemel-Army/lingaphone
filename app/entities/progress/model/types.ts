export interface TopicMastery {
  topic: string
  averageGrade: number
  gradeCount: number
  lastGradedAt: string | null
  masteryPct: number
}

export interface ActivityCell {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface PronunciationGap {
  target: string
  cardId: string
  attempts: number
  bestScore: number
  averageScore: number
  lastAttemptedAt: string
}

export interface VocabularyBuckets {
  total: number
  mastered: number
  learning: number
  weak: number
  averageBestScore: number
}

export interface StoryStats {
  totalAttempts: number
  uniqueStories: number
  averageScore: number
  bestScore: number
  perStory: Array<{
    storyId: string
    storyTitle: string
    storyLevel: string
    attempts: number
    bestScore: number
    averageScore: number
    lastAttemptedAt: string
  }>
}
