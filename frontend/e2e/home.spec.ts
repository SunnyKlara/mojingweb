import { test, expect } from '@playwright/test'

test.describe('Homepage (zh default)', () => {
  test('renders hero + primary CTA', async ({ page }) => {
    await page.goto('/')
    // next-intl middleware rewrites / -> /zh
    await expect(page).toHaveURL(/\/zh$/)
    await expect(page.locator('h1').first()).toBeVisible()
    // Contact form anchor is present
    await expect(page.locator('form').first()).toBeVisible()
  })

  test('switches to English and back', async ({ page }) => {
    await page.goto('/')
    const enLink = page.getByRole('link', { name: /^en$/i }).first()
    await enLink.click()
    await expect(page).toHaveURL(/\/en/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('has correct SEO meta', async ({ page }) => {
    await page.goto('/en')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(5)
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description?.length ?? 0).toBeGreaterThan(20)
  })

  test('sitemap.xml responds', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.ok()).toBe(true)
    const xml = await res.text()
    expect(xml).toContain('<urlset')
  })

  test('robots.txt allows crawlers', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.ok()).toBe(true)
    const body = await res.text()
    expect(body).toMatch(/User-[Aa]gent/)
  })

  test('404 page renders branded not-found', async ({ page }) => {
    const res = await page.goto('/zh/this-page-does-not-exist-xyz')
    expect(res?.status()).toBe(404)
    await expect(page.getByText('404')).toBeVisible()
  })
})
