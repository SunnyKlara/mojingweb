import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PAGES = [
  { path: '/zh', name: 'home-zh' },
  { path: '/en', name: 'home-en' },
  { path: '/zh/blog', name: 'blog-list' },
  { path: '/zh/cases', name: 'cases-list' },
]

for (const { path, name } of PAGES) {
  test(`a11y: ${name}`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules([
        // Allow color-contrast false positives from the grid background overlay.
        'color-contrast',
      ])
      .analyze()

    if (results.violations.length > 0) {
      console.log('A11y violations on', path, JSON.stringify(results.violations, null, 2))
    }
    expect(results.violations).toEqual([])
  })
}
