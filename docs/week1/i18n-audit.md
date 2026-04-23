# Week 1 · T6 · i18n Hardcoding Audit

> Baseline inventory of hardcoded user-visible strings in the frontend that
> bypass `next-intl` (`messages/en.json` / `messages/zh.json`). Produced as
> part of Week 1 T6 for **tracking only** — no migration happens this week.
>
> Target: reduce hardcoded strings to **zero** by end of Week 6 SEO/a11y
> audit. Product-facing copy changes require Owner input; this report is the
> working list.

---

## Summary

| Category                                            | Files                                                            | Approx. strings |
| --------------------------------------------------- | ---------------------------------------------------------------- | --------------- |
| **Bilingual-by-design (in-file `{en,zh}` objects)** | `cta.tsx`, `footer.tsx` (likely), `faq.tsx` (likely)             | ~40             |
| **Hardcoded Chinese-only**                          | `stat-band.tsx`, `buy.tsx`, `buy-sticky.tsx`, `hero.tsx`         | ~15             |
| **Hardcoded image alt text (zh)**                   | `listing-scroll.tsx`, `page.tsx` PosterSlide/CinematicScene alts | ~13             |
| **UI chrome**                                       | `ChatWidget.tsx` (aria-label "在线客服")                         | 1               |
| **Total**                                           | 10 files                                                         | **~69**         |

---

## Detail

### A. `frontend/components/site/stat-band.tsx`

```tsx
const STATS = [
  { value: '1:64', unit: '', label: '专为车模比例' },
  { value: '134', unit: 'mm', label: '腔内长度' },
  { value: '30', unit: 'ml', label: '烟油仓容量' },
  { value: '476', unit: 'g', label: '整机重量' },
]
```

- **Issue**: `label` strings rendered in both zh and en without switching.
- **Fix**: move to `messages/{en,zh}.json` under `stats.*`, consume via
  `useTranslations('stats')`.

### B. `frontend/components/site/buy.tsx:58-66`

```tsx
<span>180 天质保</span>
<span>7 天无理由退货</span>
<span>全球配送</span>
```

- **Fix**: `messages.*.warranty.{duration,returns,shipping}`.

### C. `frontend/components/site/buy-sticky.tsx:31-33`

```tsx
Wind Chaser 64 · 1:64 模型风洞
180 天质保 · 7 天无理由 · 全球配送
```

- **Fix**: `messages.*.stickyBar.{tagline,terms}`.

### D. `frontend/components/site/hero.tsx:36`

```tsx
立即购买 · Wind Chaser 64
```

- **Fix**: `messages.*.hero.cta`.

### E. `frontend/components/site/listing-scroll.tsx:11-22`

13 hardcoded Chinese `alt` strings for marketing images. Accessibility-relevant
because zh alt text renders regardless of browser locale.

- **Fix**: if images are truly zh-only marketing (baked-in copy), alt text
  should still be in the visitor's language. Move to
  `messages.*.listingImages.alt.<key>` with en equivalents translated.

### F. `frontend/components/ChatWidget.tsx:133`

```tsx
aria-label="在线客服"
```

- **Fix**: `messages.*.chat.ariaLabel`. (Small but matters for screen readers.)

### G. In-file `{en, zh}` bilingual objects

`cta.tsx:1-22` and likely `footer.tsx` / `faq.tsx` use a local
`{ en: {...}, zh: {...} }` dictionary. This **does** render in the right
language but:

- Violates §2 "every user-visible string comes from `messages/*.json`".
- Blocks future locales (fr, de, jp) because adding a third language requires
  editing every component instead of dropping in a new messages file.
- Prevents the i18n pipeline (translation management, completeness lint)
  from seeing the strings.

- **Fix**: migrate each `{en,zh}` dictionary to `messages/*.json` namespaces
  mirroring component names.

---

## Remediation plan

**Do not touch this week.** Scheduled work:

- **Week 4** (chat feature PR): migrate `ChatWidget.tsx` strings as part of
  its i18n pass (typing / read receipts / offline queue all need new copy
  anyway).
- **Week 6** (SEO + a11y audit): migrate the remaining ~50 strings in a
  single sweep, add a CI lint (`scripts/i18n-check.mjs`) that greps for
  Chinese/English in JSX text nodes outside `t(...)` calls.
- Add `.eslintrc` rule `i18next/no-literal-string` scoped to
  `components/site/**` once all migrations are done.

---

## Out of scope for this audit

- **Marketing poster images** (`/public/brand/*.png`) carry baked-in zh copy.
  These are bitmap assets, not JSX. Localizing them requires design work
  and is a V2+ concern.
- **Admin console text** (`app/(admin)/admin/**`): intentionally zh-only
  since the admin persona is internal staff; tracking separately in the
  admin redesign backlog (Week 2).
