import { z } from 'zod'

/**
 * Zod validation schemas used across the application.
 */

// Email
export const emailSchema = z.string().email('Введите корректный email')

// Password — min 8 chars, at least 1 letter and 1 digit
export const passwordSchema = z
  .string()
  .min(8, 'Минимум 8 символов')
  .regex(/[a-zA-Zа-яА-Я]/, 'Минимум 1 буква')
  .regex(/\d/, 'Минимум 1 цифра')

// Phone — Kazakhstan format
export const phoneSchema = z
  .string()
  .regex(/^\+7\d{10}$/, 'Формат: +7XXXXXXXXXX')
  .optional()
  .or(z.literal(''))

// Name — 2-50 chars, cyrillic or latin
export const nameSchema = z
  .string()
  .min(2, 'Минимум 2 символа')
  .max(50, 'Максимум 50 символов')

// Login form
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Введите пароль')
})
export type LoginFormData = z.infer<typeof loginFormSchema>

// Registration form
export const registerFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  name: nameSchema,
  surname: nameSchema,
  phone: phoneSchema,
  role: z.enum(['STUDENT', 'PARENT']),
  // Student-specific
  grade: z.number().min(1).max(6).optional()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword']
})
export type RegisterFormData = z.infer<typeof registerFormSchema>

// Message
export const messageSchema = z.object({
  content: z.string().min(1, 'Сообщение не может быть пустым').max(5000)
})
export type MessageFormData = z.infer<typeof messageSchema>

// Lesson creation
export const createLessonSchema = z.object({
  title: z.string().min(1, 'Укажите название'),
  description: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'GROUP']),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(180).default(50),
  studentIds: z.array(z.string().uuid()).min(1, 'Выберите учеников')
})
export type CreateLessonData = z.infer<typeof createLessonSchema>
