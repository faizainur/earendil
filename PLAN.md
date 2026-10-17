# Personal Blog FE — Step-by-Step Milestone Plan

Companion to `DESIGN.md` in this directory. Each milestone ends with a verifiable outcome.

**Status (2026-10-17):** M1–M6 shipped and merged (M4 also gained the `::: grid` container directive); M7 (responsive/a11y polish) and M8 (deploy/BE swap) remain. Post-milestone rounds below (3.6/3.7) are delivered as separate merged branches.

---

---

## Milestone 1 — Scaffold + Tailwind + Theme system

**Goal:** running app with design tokens, theme toggle, layout shell.

1. `npx sv create` → SvelteKit, Svelte 5, TypeScript, ESLint + Prettier.
2. Install Tailwind v4: `@tailwindcss/vite` (add plugin to `vite.config.ts`); `src/app.css` = `@import "tailwindcss"`.
3. Install `@tailwindcss/typography`, `prettier-plugin-tailwindcss`, and fonts: `@fontsource-variable/inter` + `@fontsource/jetbrains-mono` (self-hosted, imported in `src/app.css`).
4. Extract exact tokens from Flowstep screens (`get-screen-jsx`): surface/surface-dark, ink/ink-muted, border-subtle, radii → fill `@theme` block (`--container-page: 1120px`, `--font-sans: "Inter Variable", …`, `--font-mono: "JetBrains Mono", …`).
5. Add `@custom-variant dark` (data-theme based).
6. Theme store: cookie-based (`+layout.server.ts` reads `theme` cookie → `data-theme` on `<html>`; `+layout.svelte` handles toggle → optimistic flip + cookie set; default = `prefers-color-scheme`).
7. Build layout shell components (Tailwind utilities only):
   - `Navbar.svelte`: wordmark + nav + `SearchPill` (desktop) / icon button (mobile, same styling per §8 of DESIGN.md) + `ThemeToggle` (sun/moon).
   - `Footer.svelte`: `© 2026 Faiz Ainur Rofiq` + social links (owner-editable) + builder line.
   - Page container: `mx-auto max-w-page px-4 md:px-6`.
8. Placeholder `/` page to verify chrome.

**Verify:** app renders shell; toggle flips light/dark with no FOUC on reload; 1120px container respected; navbar collapses correctly at mobile widths.

---

## Milestone 2 — API client + mock layer

**Goal:** typed data layer, swappable mock↔real.

1. `src/lib/api/types.ts`: `PostSummary`, `PostDetail`, list/suggest response shapes (per DESIGN.md §4).
2. `src/lib/api/client.ts`: interface + `fetch`-based implementation reading `PUBLIC_API_BASE`.
3. `src/lib/api/mock.ts`: fixtures mirroring the screens (Selected writing list; "queue" results with unsplash `d55a2c14`/`d24cecb6`; sample article).
4. Adapter selection: mock used when `PUBLIC_API_BASE` unset.

**Verify:** unit-test the client against mock fixtures; types compile with no `any`.

---

## Milestone 3 — Homepage (SSR)

**Goal:** Screen 1/5 parity.

1. `routes/+page.server.ts`: SSR fetch curated "Selected writing" list from BE — **render payload as-is** (no FE sorting/limiting; curation is BE's job).
2. `PostCard.svelte` / list rows: title, preview, date, read time (+ thumbnail treatment per design).
3. Greeting + headline per mockup.
4. Light/dark + responsive QA (stacked mobile cards).

**Review pass (2026-10-16):** footer sticks to bottom on short pages (flex-grow main); optional post thumbnails in list (null ⇒ title + preview only); hero gains decorative SVG on the right (desktop); new "Photography" section — CSS-columns masonry for mixed aspect ratios (`GET /api/photos`); homepage footer gains a contact form (`POST /api/contact` via SvelteKit form action) — superseded by Milestone 3.5.

**Verify:** view-source shows SSR'd content; matches Screens 1 & 5.

---

## Milestone 3.5 — Home curation + pages

**Goal:** writing-first homepage; nav = Home · Articles · Gallery · About; `/articles`, `/gallery`, `/about` exist; contact form removed. One commit, stacked on `milestone/3-homepage`.

1. **Navbar:** exactly 4 links — Home `/`, Articles `/articles`, Gallery `/gallery`, About `/about`; drop "Now"; active link emphasized via `$app/state` pathname (`font-medium text-foreground` vs `text-muted-foreground`).
2. **Mobile nav = hamburger:** `md:hidden` icon button opens a dropdown panel under the header with stacked links; closes on link click, `Esc`, and outside tap; `aria-expanded`/`aria-controls`; auto-closes on `page.url` change. No drawer/portal.
3. **Home photography → teaser strip:** one row of `h-28 md:h-32` fixed-height `object-cover` crops, `overflow-x-auto` + scroll-snap, fed by `getPhotos({ limit: 6 })`; ends with "Full gallery →" link. The full mixed-aspect masonry moves to `/gallery` — homepage stays calm, writing leads.
4. **Remove the contact form:** delete `ContactForm.svelte`, the `contact` form action, `sendContact()` (client/mock/types), and the `destructive` color token. Footer minimal (© + links) on every page.
5. **`/articles`:** SSR pagination — `?page=N` → `getPosts({ offset: (N-1)*10, limit: 10 })`; reuses `PostCard`; Newer/Older plain links + "Page X of Y" (page size 10).
6. **`/gallery`:** full masonry (`columns-2 md:columns-3`, `break-inside-avoid`), lazy images with reserved dimensions.
7. **`/about`:** static FE page using the existing hero bio copy; trivially movable to BE-driven later.

**Verify:** new unit test — mock `getPhotos` honors `limit`; `svelte-check` 0/0, lint, unit, build green; curl-SSR `/articles` (`?page=2` slicing + pagination links) and `/gallery` (masonry images); hamburger closes on Esc/outside-tap/navigate; nav active-state correct on all 4 routes.

**Contract delta (reflect in DESIGN.md when implementing):** `GET /api/photos?limit=6` (optional `limit`; gallery calls without) — **`POST /api/contact` REMOVED**.

---

## Milestone 3.6 — Listing consolidation (2026-10-17) · `milestone/search-consolidation` ✅

**Goal:** one listing surface instead of two.

1. `/articles` **removed**; home now lists ALL posts, SSR-paginated (`?page=N`, size 10, Newer/Older + "Page X of N"). Out-of-range pages 307-clamp, preserving filters.
2. New `/search` route: query (`?q=`) **or** tag (`?tag=`) results page — ranked via new `GET /api/search?q&offset&limit`, paginated with filter preserved, on-page GET search form, `noindex` on query views, Clear link. Tags everywhere now link here.
3. Palette gains the **see-all hand-off**: trailing `→ See all results for "…"` row in the arrow-key range; Enter with no match routes to `/search?q=`. Launcher stays capped at 8.
4. Nav drops to **3 links** (Home · Gallery · About); breadcrumb middle crumb `Articles` → `Writing` (`/#writing`).
5. `ArticleCard.svelte` **kept** in the codebase per owner's choice (unused); mock corpus grown to 12 posts so pagination is exercisable.
6. `BlogApi.searchPosts` added (interface + fetch + mock ranking: occurrence score over title/subtitle/preview/tags).

**Verify:** home spans 2 pages (`Page 1 of 2`, `?page=99`→307); `/search?tag=postgres` + `?q=queue` SSR correctly; palette keyboard flow; all tests updated (24).

---

## Milestone 3.7 — Brand identity & micro-motion (2026-10-17) · `milestone/home-identity` ✅

1. **Hero:** Fraunces display headline (`md:text-5xl`, wonk-italic accent word, violet `;`), `currently —` micro-line, **featured photograph** right (`getFeaturedPhoto` → `GET /api/photos/featured`; grayscale→color bloom on hover, links to `/gallery`; line-art SVG fallback).
2. **Listings redesign:** dropped the `01;` curation index (read as listicle); row = mono date·read-time masthead **above** a Fraunces serif title with violet underline-grow on hover; section headers became serif `Writing`/`Photography` headings (SectionLabel v2).
3. **Motion:** staggered `fade-up` entrance on all pages; `fade-in` (400ms) + `{#key}` re-mount on pagination/filter swaps; hamburger menu now slides (180ms cubic-out) over a dim+blur scrim; all reduced-motion-guarded.
4. **Brand system:** Fraunces italic woff2 self-hosted; `fzr;` = stylized initials of Faiz Ainur Rofiq; violet `--brand` is the single accent (wordmark, underlines, progress bar).

**Verify:** lint/check/tests green; hero + serif titles + fade wrappers confirmed in SSR & compiled CSS.

---

## Milestone 4 — Markdown engine

**Goal:** `render.ts` pipeline, tested standalone before UI.

1. Install: `markdown-it`, `markdown-it-anchor`, `isomorphic-dompurify`, `shiki`.
2. `src/lib/markdown/render.ts`:
   - markdown-it + anchor (slugify) + tables/strikethrough/task-lists.
   - Shiki fence highlighter, `themes: { light, dark }`, bundle only: `go, rust, clojure, javascript, typescript, python, bash, yaml, json, dockerfile, hcl`.
   - TOC extraction from tokens (h2/h3 + ids) → structured JSON.
   - DOMPurify sanitize of final HTML.
3. Shiki CSS-var mapping block (raw-CSS exception #2).
4. Unit tests on fixtures: headings/anchors, code blocks dual-theme output, TOC shape, sanitization strips `<script>`.

**Verify:** tests green; sample article HTML renders correct with anchors + highlighted code.

---

## Milestone 5 — Article page

**Goal:** Screens 2 & 6 parity.

1. `posts/[slug]/+page.server.ts`: fetch post, run `render.ts` server-side → `{ html, toc, meta }`.
2. Layout: `lg:grid` three zones — left metadata rail / main `.prose` column / right sticky TOC (`sticky top-x`, hidden `<lg`).
3. **Breadcrumb** `Home / Writing / <article title>` rendered below title + description (M3.6 renamed the middle crumb; links `/#writing`) — `text-xs text-muted-foreground`, links `hover:text-foreground`, current crumb not a link (M3.5 review decision).
4. Inline TOC under title (mobile path), body sections, blockquote style, "Further reading" — **no comments section**.
5. Client enhancement action on content container: hover-revealed Wrap | Copy icon toolbar on code blocks, `loading=lazy` images, IntersectionObserver active-TOC highlight.

**Verify:** matches Screens 2/6; mobile collapses correctly; TOC scroll-sync works.

---

## Milestone 6 — Search palette

**Goal:** Screens 1/5 dialog + mobile triggers.

1. `SearchDialog.svelte`: centered rounded dialog (`max-w-2xl`), dim + `backdrop-filter: blur`, symmetric svelte `fade`+`scale` open/close transitions; mobile sheet via padding; input focused at mount (the `autofocus` attribute no-ops on dynamic dialogs).
2. Global `Mod+K`/`Ctrl+K` keybind; pill click; mobile icon-button tap.
3. Debounced (200ms) suggest calls guarded by a monotonic request-sequence counter (no AbortSignal in `suggestPosts`); result rows (optional thumbnail/title/preview/date+readTime); Enter/click → navigate; loading skeletons; empty state; see-all hand-off to `/search` (M3.6).
4. A11y: focus trap, `role="dialog"`, Esc closes, focus restore.

**Verify:** keyboard-only flow works; matches mockup states; abort race test.

---

## Milestone 6.5b — Route B: client-rendered diagrams (2026-10-17) · branch `feature/mermaid-client-render` ✅ (comparison build)

**Goal:** render mermaid in the visitor's browser — deleting the whole BE render pipeline (jobs, S3, visible-gate, id allowlists).

1. `render.ts`: `mermaid` fences bypass Shiki → `pre.mermaid-src` + escaped source (= SSR content, no-JS state, failure fallback — one thing does all three).
2. `mermaidDiagrams` action: lazy `import('mermaid')` (separate chunk; only diagram pages pay ~1.4MB raw), init `theme: 'base'` + `securityLevel: 'strict'` with `themeVariables` read from `--diagram-*` tokens, render→swap, `animate-pulse` shimmer during the chunk gap, MutationObserver on `data-theme` re-renders live.
3. Queue fixture gained a real ` ```mermaid ` flowchart; +1 pipeline test (25 total); SSR placeholder verified; chunks dir shows lazy split.
4. Deliberately diverges from "FE renders payload as-is": mermaid is treated as a _renderer_ (like Shiki/TOC), not post-processing.

**Compare against** `feature/a-inline-diagrams` (SSR inline, zero JS, needs the BE pipeline) — both share the `--diagram-bg/surface/ink/muted/line` neutral contract (A-inline additionally paints with its own accent token); decision after side-by-side eyeball: TTFB & layout shift (A) vs chunk fetch & post-hydration pop-in (B).

**Refined (2026-10-18):**

1. **Shimmer skeleton**: the action now swaps placeholders for `.diagram-loading` synchronously on the hydration tick (gradient-sweep keyframes, `role="status"`, reduced-motion safe) — JS visitors never see raw source; the code remains only the no-JS state and per-diagram failure fallback.
2. **Click-to-zoom**: rendered diagrams get `cursor-zoom-in` + a click handler feeding the existing `ImageLightbox` a `data:image/svg+xml` snapshot of the current SVG (works because mermaid bakes hex colors — unlike var()-based A-inline SVGs). Snapshot built on click ⇒ always shows the live theme. Fix post-review: mermaid's `viewBox` + `max-width` sizing is inline-only — as an `<img>` the snapshot had no intrinsic size and rendered tiny; `svgForZoom` bakes px width/height from the viewBox (3 regression tests).
3. **Theming maintenance contract**: neutrals (background, text, lines) + chart-series ramps live ONLY as `--diagram-*` tokens in layout.css; the JS mapping is the `MERMAID_VARS`/`RAMP` table in actions.ts (zero hardcoded colors, no scattered fallbacks; missing token ⇒ dev console warning). `darkMode` derived from `data-theme` (fixes derived-tone direction in dark). **Adopted v12's categorical themes** (`redux-color` / `redux-dark-color`, picked by mode): entities/actors cycle the theme's built-in 12-hue `borderColorArray`/`bkgColorArray` — the per-box variance, deliberately not token-mapped (overriding the primary/secondary/tertiary trio would flatten it; the dark counterpart intentionally ships an empty fill array for contrast, and `updateColors()`'s `x = x || derived` guards let neutrals win without touching the palette). `themeCSSVariables` checked — NOT in the installed 12.2.0 build, so re-render stays the sync mechanism. The earlier `theme: base` + `look: 'classic'` pin (determinism against v12's split-brain per-type defaults) was traded away once the categorical look won the eyeball test — each type family stays internally consistent with its own palette.
4. **Guardrail tests**: `theming.contract.test.ts` couples the two files — every `--diagram-*` value hex-only, light/dark token parity, every mapped token exists in CSS (+1 pipeline test → 28 total).
5. **Test garden**: queue → flowchart (redux-default family), latency → sequenceDiagram (same family), observability → pie (classic-default family) — both v12 default paths exercised with topically honest content. The placeholder rule is diagram-type-agnostic (keys on the `mermaid` info string; mermaid dispatches on the source's first line), proven by a test with mindmap/xychart fences, and the `cScale` categorical family was mapped for quadrantChart/radar/xyChart — all other v12 types inherit the base-palette derivation. (+2 tests → 29 total.)

---

## Milestone 7 — Responsive + a11y polish

1. Screenshot-diff QA against **all 8 Flowstep screens** (theme × viewport).
2. Touch targets ≥44px; contrast pass; semantic landmarks; `prefers-reduced-motion` on dialog/pill-zoom transitions.
3. Lighthouse pass (SEO, a11y, performance) on home + article.

**Verify:** zero known visual deviations from the 8 screens; Lighthouse ≥95 a11y/SEO.

---

## Milestone 8 — Deploy + BE swap

1. `adapter-node` build → Dockerfile (multi-stage, non-root).
2. K3s manifest sized to reserved budget (256Mi req / 512Mi limit); env: `PUBLIC_API_BASE` (in-cluster CMS service URL) + `PUBLIC_SITE_URL` (`https://blog.ainurrofiq.com`).
3. DNS + ingress for `blog.ainurrofiq.com` (root domain → redirect/landing); wildcard cert `*.ainurrofiq.com` via cert-manager DNS-01. **`cms.` never publicly exposed** (see DESIGN §9).
4. When real BE is live: point `PUBLIC_API_BASE` at the service, remove mock. **Any other change ⇒ contract drift — fix the API, not the FE.**
5. RSS link → BE `/feed.xml` (absolute URLs from `PUBLIC_SITE_URL`); add canonical/OG tags at the same time.
6. Optional: `faizrofiq.com` (available 2026-10-17) as owner/email insurance domain → 301 to the blog.

**Verify:** container runs on cluster; real articles flow end-to-end with no FE code change.

---

## Open decisions — RESOLVED

- **Shiki language set**: `go, rust, clojure, javascript, typescript, python, bash, yaml, json, dockerfile, hcl` (Terraform). K8s via `yaml`.
- **Fonts**: Inter (self-hosted variable) + JetBrains Mono for code. Alts if desired: Geist Sans, Atkinson Hyperlegible.
- **"Selected writing"**: BE-curated; FE renders payload as-is. **General rule: no FE post-processing of any BE data** (articles, list, search, suggestions). TOC extraction remains a rendering step, not data processing.
  _(Evolved in M3.6: the home "Selected writing" list became the full paginated feed — the no-post-processing rule and BE-curation principle are unchanged: feed order, featured hero photo, and tag sets remain BE decisions.)_
- **M3.5 round**: 4-link nav (Home/Articles/Gallery/About) + mobile hamburger; contact form removed (spam surface + footer weight); homepage photography demoted to a fixed-height teaser strip (masonry lives on `/gallery`); About is static FE; pagination is Newer/Older, page size 10; article breadcrumb below title/description in M5.
