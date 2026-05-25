import { describe, expect, it } from 'vitest'
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  nameSchema,
  loginFormSchema,
  registerFormSchema,
  reviewFormSchema,
  messageSchema,
  createLessonSchema
} from '../../app/shared/lib/validators'

describe('emailSchema', () => {
  it('accepts valid emails', () => {
    expect(emailSchema.safeParse('user@test.com').success).toBe(true)
    expect(emailSchema.safeParse('student@femo.kz').success).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(emailSchema.safeParse('invalid').success).toBe(false)
    expect(emailSchema.safeParse('').success).toBe(false)
    expect(emailSchema.safeParse('no@').success).toBe(false)
  })
})

describe('passwordSchema', () => {
  it('accepts valid passwords', () => {
    expect(passwordSchema.safeParse('password1').success).toBe(true)
    expect(passwordSchema.safeParse('MyP@ss99').success).toBe(true)
    expect(passwordSchema.safeParse('тестовый1').success).toBe(true)
  })

  it('rejects short passwords', () => {
    expect(passwordSchema.safeParse('pass1').success).toBe(false)
  })

  it('rejects passwords without digits', () => {
    expect(passwordSchema.safeParse('onlyletters').success).toBe(false)
  })

  it('rejects passwords without letters', () => {
    expect(passwordSchema.safeParse('12345678').success).toBe(false)
  })
})

describe('phoneSchema', () => {
  it('accepts valid Kazakhstan phones', () => {
    expect(phoneSchema.safeParse('+77001234567').success).toBe(true)
  })

  it('accepts empty string (optional)', () => {
    expect(phoneSchema.safeParse('').success).toBe(true)
  })

  it('accepts undefined (optional)', () => {
    expect(phoneSchema.safeParse(undefined).success).toBe(true)
  })

  it('rejects non-KZ format', () => {
    expect(phoneSchema.safeParse('+1234567890').success).toBe(false)
    expect(phoneSchema.safeParse('87001234567').success).toBe(false)
  })
})

describe('nameSchema', () => {
  it('accepts valid names', () => {
    expect(nameSchema.safeParse('Айдана').success).toBe(true)
    expect(nameSchema.safeParse('John').success).toBe(true)
  })

  it('rejects too short', () => {
    expect(nameSchema.safeParse('A').success).toBe(false)
  })

  it('rejects too long', () => {
    expect(nameSchema.safeParse('x'.repeat(51)).success).toBe(false)
  })
})

describe('loginFormSchema', () => {
  it('accepts valid login', () => {
    const result = loginFormSchema.safeParse({
      email: 'user@test.com',
      password: 'anypassword'
    })
    expect(result.success).toBe(true)
  })

  it('requires both fields', () => {
    expect(loginFormSchema.safeParse({ email: 'user@test.com' }).success).toBe(false)
    expect(loginFormSchema.safeParse({ password: 'pass' }).success).toBe(false)
  })
})

describe('registerFormSchema', () => {
  const validData = {
    email: 'student@test.com',
    password: 'password1',
    confirmPassword: 'password1',
    name: 'Айдана',
    surname: 'Калиева',
    phone: '+77001234567',
    role: 'STUDENT' as const,
    grade: 10
  }

  it('accepts valid student registration', () => {
    expect(registerFormSchema.safeParse(validData).success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = registerFormSchema.safeParse({
      ...validData,
      confirmPassword: 'different1'
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid role', () => {
    const result = registerFormSchema.safeParse({
      ...validData,
      role: 'ADMIN'
    })
    expect(result.success).toBe(false)
  })

  it('rejects grade out of range', () => {
    expect(registerFormSchema.safeParse({ ...validData, grade: 4 }).success).toBe(false)
    expect(registerFormSchema.safeParse({ ...validData, grade: 12 }).success).toBe(false)
  })
})

describe('reviewFormSchema', () => {
  it('accepts valid review', () => {
    expect(reviewFormSchema.safeParse({ rating: 5 }).success).toBe(true)
    expect(reviewFormSchema.safeParse({ rating: 3, comment: 'Good!' }).success).toBe(true)
  })

  it('rejects invalid rating', () => {
    expect(reviewFormSchema.safeParse({ rating: 0 }).success).toBe(false)
    expect(reviewFormSchema.safeParse({ rating: 6 }).success).toBe(false)
  })
})

describe('messageSchema', () => {
  it('accepts valid messages', () => {
    expect(messageSchema.safeParse({ content: 'Hello' }).success).toBe(true)
  })

  it('rejects empty messages', () => {
    expect(messageSchema.safeParse({ content: '' }).success).toBe(false)
  })

  it('rejects too long messages', () => {
    expect(messageSchema.safeParse({ content: 'x'.repeat(5001) }).success).toBe(false)
  })
})

describe('createLessonSchema', () => {
  const validLesson = {
    title: 'Математика 4 класс',
    type: 'INDIVIDUAL' as const,
    scheduledAt: '2025-03-20T10:00:00Z',
    duration: 50,
    studentIds: ['123e4567-e89b-12d3-a456-426614174000']
  }

  it('accepts valid lesson', () => {
    expect(createLessonSchema.safeParse(validLesson).success).toBe(true)
  })

  it('accepts group lessons', () => {
    const result = createLessonSchema.safeParse({
      ...validLesson,
      type: 'GROUP',
      studentIds: [
        '123e4567-e89b-12d3-a456-426614174000',
        '223e4567-e89b-12d3-a456-426614174000'
      ]
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty studentIds', () => {
    expect(createLessonSchema.safeParse({ ...validLesson, studentIds: [] }).success).toBe(false)
  })

  it('rejects duration out of range', () => {
    expect(createLessonSchema.safeParse({ ...validLesson, duration: 10 }).success).toBe(false)
    expect(createLessonSchema.safeParse({ ...validLesson, duration: 200 }).success).toBe(false)
  })
})
