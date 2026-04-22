import { test, expect } from '@playwright/test'

test.describe('Content pages', () => {
  test('blog list page renders cards', async ({ page }) => {
    await page.goto('/zh/blog')
    await expect(page.locator('h1').first()).toBeVisible()
    // At least one article link
    const articles = page.locator('a[href*="/blog/"]')
    await expect(articles.first()).toBeVisible()
  })

  test('opening a blog post renders MDX content', async ({ page }) => {
    await page.goto('/zh/blog')
    const firstPost = page.locator('a[href*="/blog/"]').first()
    const href = await firstPost.getAttribute('href')
    await firstPost.click()
    if (href) await expect(page).toHaveURL(new RegExp(href))
    // Prose article body
    await expect(page.locator('article, .prose').first()).toBeVisible()
  })

  test('cases list page renders', async ({ page }) => {
    await page.goto('/zh/cases')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})
