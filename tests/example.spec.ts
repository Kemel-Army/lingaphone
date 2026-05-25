import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('Landing page', () => {
  test('loads and displays title', async ({ page, goto }) => {
    await goto('/', { waitUntil: 'hydration' })
    await expect(page).toHaveTitle(/FEMO/)
  })

  test('has navigation links', async ({ page, goto }) => {
    await goto('/', { waitUntil: 'hydration' })
    const loginLink = page.getByRole('link', { name: /войти|кіру/i })
    await expect(loginLink).toBeVisible()
  })
})

test.describe('Auth pages', () => {
  test('login page loads', async ({ page, goto }) => {
    await goto('/login', { waitUntil: 'hydration' })
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('register page loads', async ({ page, goto }) => {
    await goto('/register', { waitUntil: 'hydration' })
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('login form validates on empty submit', async ({ page, goto }) => {
    await goto('/login', { waitUntil: 'hydration' })
    const submitButton = page.getByRole('button', { name: /войти|кіру/i })
    if (await submitButton.isVisible()) {
      await submitButton.click()
      await expect(page).toHaveURL(/login/)
    }
  })
})

test.describe('Public pages', () => {
  test('about page loads', async ({ page, goto }) => {
    await goto('/about', { waitUntil: 'hydration' })
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('contact page loads', async ({ page, goto }) => {
    await goto('/contact', { waitUntil: 'hydration' })
    await expect(page.getByRole('heading')).toBeVisible()
  })
})
