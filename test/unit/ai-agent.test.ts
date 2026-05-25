import { describe, expect, it } from 'vitest'
import { buildIaeSystemPrompt } from '../../server/utils/ai-agent'

describe('buildIaeSystemPrompt', () => {
  it('returns base prompt for free mode', () => {
    const prompt = buildIaeSystemPrompt({ mode: 'FREE' })
    expect(prompt).toContain('AI-репетитор')
    expect(prompt).toContain('русском')
    expect(prompt).toContain('свободный вопрос')
  })

  it('includes subject and topic when provided', () => {
    const prompt = buildIaeSystemPrompt({
      mode: 'EXPLAIN',
      subject: 'Математика',
      topic: 'Квадратные уравнения'
    })
    expect(prompt).toContain('Математика')
    expect(prompt).toContain('Квадратные уравнения')
    expect(prompt).toContain('объяснение')
  })

  it('switches language label for Kazakh', () => {
    const prompt = buildIaeSystemPrompt({ mode: 'FREE', language: 'kz' })
    expect(prompt).toContain('казахском')
  })

  it('includes student model info', () => {
    const prompt = buildIaeSystemPrompt({
      mode: 'PRACTICE',
      studentModel: {
        difficultyLevel: 7,
        learningStyle: 'visual',
        speed: 'medium',
        knowledgeMap: {
          algebra: 90,
          geometry: 30,
          trigonometry: 45
        },
        errorPatterns: {
          geometry: ['перепутал формулы площади']
        }
      }
    })
    expect(prompt).toContain('7/10')
    expect(prompt).toContain('visual')
    expect(prompt).toContain('medium')
    expect(prompt).toContain('geometry')
    expect(prompt).toContain('trigonometry')
    expect(prompt).toContain('перепутал формулы площади')
    // algebra is 90, not weak
    expect(prompt).not.toContain('Слабые темы: algebra')
    expect(prompt).toContain('Сократический метод')
  })

  it('handles EXPLAIN mode', () => {
    const prompt = buildIaeSystemPrompt({ mode: 'EXPLAIN' })
    expect(prompt).toContain('объяснение')
    expect(prompt).toContain('KaTeX')
  })

  it('handles PRACTICE mode', () => {
    const prompt = buildIaeSystemPrompt({ mode: 'PRACTICE' })
    expect(prompt).toContain('Сократический метод')
  })

  it('handles CHECK_HW mode', () => {
    const prompt = buildIaeSystemPrompt({ mode: 'CHECK_HW' })
    expect(prompt).toContain('домашнего задания')
  })

  it('handles MOCK_TEST mode', () => {
    const prompt = buildIaeSystemPrompt({ mode: 'MOCK_TEST' })
    expect(prompt).toContain('пробный тест')
  })

  it('defaults to FREE mode for unknown', () => {
    const prompt = buildIaeSystemPrompt({ mode: 'UNKNOWN' })
    expect(prompt).toContain('свободный вопрос')
  })

  it('handles empty student model fields gracefully', () => {
    const prompt = buildIaeSystemPrompt({
      mode: 'FREE',
      studentModel: {}
    })
    expect(prompt).toContain('AI-репетитор')
    expect(prompt).not.toContain('undefined')
  })

  it('filters only weak topics from knowledge map', () => {
    const prompt = buildIaeSystemPrompt({
      mode: 'FREE',
      studentModel: {
        knowledgeMap: {
          strong_topic: 80,
          weak_topic: 20
        }
      }
    })
    expect(prompt).toContain('weak_topic')
    expect(prompt).not.toContain('strong_topic')
  })
})
