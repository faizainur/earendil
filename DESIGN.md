# Personal Blog FE — Design Document

> UI source of truth: Flowstep file `f82d3fbc-3f1e-4f24-ac48-e19143ccb2fa` (8 screens:
> light/dark × homepage/article × desktop/mobile, plus mobile light/dark variants).
> Note: `/home/fzr/Projects/personal-blog/DESIGN.md` is the backend K3s infra blueprint — unrelated to this FE design.

## 1. Stack

| Concern            | Choice                                                                                                                                                     | Rationale                                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | **Svelte 5 + SvelteKit** (TypeScript, Vite)                                                                                                                | Small bundle, great interactions (search palette), file-based routing, SSR                                                                              |
| Fonts              | **Inter** (variable, self-hosted `@fontsource-variable/inter`) + **JetBrains Mono** (`@fontsource/jetbrains-mono`) + **Fraunces Variable** (wordmark only) | Sans matches the mockup grotesque; self-hosted = no external request/FOUT. Fraunces (SOFT/WONK axes) is the `fzr;` brand serif — never used for body/UI |
| Rendering          | **SSR** via `adapter-node`                                                                                                                                 | SEO (articles crawlable), server-side API fetch in load functions, fits K3s 256/512Mi backend container budget                                          |
| Styling            | **Tailwind CSS v4** (`@tailwindcss/vite`)                                                                                                                  | Config lives in CSS (`@theme`), no `tailwind.config.js`; minimal raw CSS (~8 exceptions, §7)                                                            |
| Markdown           | **markdown-it** + `markdown-it-anchor` (+ tables/strikethrough/task-lists)                                                                                 | Runtime content from API ⇒ mdsvex (build-time) is not applicable; token access powers TOC/anchors                                                       |
| Sanitization       | **DOMPurify** (`isomorphic-dompurify`, server-side)                                                                                                        | Mandatory — API content treated as untrusted                                                                                                            |
| Code highlighting  | **Shiki, server-side**, dual-theme mode (`themes: { light, dark }`)                                                                                        | VS Code-grade grammars; client ships plain highlighted HTML; theme flips via CSS vars without refetch                                                   |
| Article typography | `@tailwindcss/typography` as base, overridden to match mockups                                                                                             | Avoids hand-writing prose CSS                                                                                                                           |
| Formatting         | Prettier + `prettier-plugin-svelte` + `prettier-plugin-tailwindcss`, ESLint                                                                                | Class-order consistency                                                                                                                                 |

## 2. Pages & Layout

| Route           | Content                                                                                                                                                                                                                                                                                                                                                                                                                           | Screens             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `/`             | Identity-forward hero (Fraunces headline + italic accent + violet `;`, muted intro, `currently —` line, **featured photograph** right via `getFeaturedPhoto` — grayscale→color on hover, links to `/gallery`, SVG fallback). Below it, the **full post list, SSR-paginated** (`?page=N`, size 10, Newer/Older) using `PostCard` rows. **No dedicated listing page** — `/articles` was merged into home. **No hero search field.** | 1 (light), 5 (dark) |
| `/search`       | Results page for a _query_ (`?q=`) or a _tag_ (`?tag=`), SSR-paginated (size 10, filter preserved across pages). "Results for \"x\" · N posts" + Clear link + an on-page search form (GET). Query views are `noindex`. Reuses `PostCard` rows. This is the destination for the palette's "see all" and every tag chip.                                                                                                            | —                   |
| `/gallery`      | Full mixed-aspect masonry grid (`columns-2 md:columns-3`, lazy, reserved dimensions) — the interesting mis-aligned rows live here, not on the homepage                                                                                                                                                                                                                                                                            | —                   |
| `/about`        | Static FE bio page (hero-style header + paragraphs); trivially movable to BE-driven later                                                                                                                                                                                                                                                                                                                                         | —                   |
| `/posts/[slug]` | Title + description, breadcrumb below (`Home / Articles / <title>`), hero thumbnail when present, metadata, inline TOC, body sections, quote, "Further reading". **No comments/Discussion section**                                                                                                                                                                                                                               | 2 (light), 6 (dark) |
| (future)        | RSS redirect to BE `/feed.xml`                                                                                                                                                                                                                                                                                                                                                                                                    | —                   |

Layout shell (all pages):

- **Route-change feedback**: a fixed 2px `--brand` violet progress bar rides across the top whenever SvelteKit navigates between pages — it eases to ~94% while loading, then sweeps to 100% and fades. Hover-preloaded routes finish in ~1 frame, so a small JS state machine guarantees a minimum visible beat (~280ms) before the fade. Hash-only jumps (TOC links) are excluded; reduced-motion gets a plain static bar.
- **Section labels**: every section header is `SectionLabel.svelte` — Fraunces small label + violet `;` marker (the brand motif repeated as rhythm).
- **Container**: centered `max-w-page` (1120px) with generous equal side margins; content never stretches to full viewport. Mobile: `px-4`/`px-6` gutters.
- **Navbar**: wordmark **`fzr;`** (Fraunces brand serif, `SOFT 40 / WONK 1`: `fzr` foreground + **violet semicolon** `--brand` — the accent is reserved to the punctuation, nothing else; serif is wordmark-only) + **3 links (Home · Gallery · About)** with pathname-derived active state (`aria-current="page"`) + **Search pill** (opens the ⌘K palette) + **Theme toggle**. Desktop links carry the brand motif: a violet (`--brand`) underline grows from the left on hover and stays on the active page (`after:` utilities). Search is reached via the pill/⌘K, not a nav link.
- **Mobile nav**: links collapse into a **hamburger** (`md:hidden`); icon button toggles a dropdown panel under the header with stacked links; closes on link click, `Esc`, outside tap, and on navigation; `aria-expanded`/`aria-controls`. Opens/closes with a 180ms `slide` (cubic-out) + dimmed, blurred scrim (dialog scrim language), auto-collapsed under reduced-motion.
- **Search pill (desktop)**: bordered rounded pill, magnifier icon, label "Search", visible `Mod+K` kbd hint.
- **Search (mobile)**: compact bordered **rounded-square icon-only button** (magnifier only; no label, no kbd hint). Pill hidden on mobile; icon button hidden on desktop. Icon button + theme toggle fit on one mobile header row, ≥44px touch targets.
- **Theme toggle**: bordered rounded button beside search; **sun icon in light state, moon icon in dark state**. Switching animates via the View Transitions API: the new palette reveals in a circle growing from the toggle's corner (450ms; instant where unsupported or reduced-motion).
- **Footer**: `© 2026 Faiz Ainur Rofiq` + social links + a muted builder line `Built with SvelteKit · self-hosted · no trackers;` (violet semicolon). Single row on desktop; wraps/stacks on mobile.

Article page zones (desktop ≥ lg): left **metadata rail** (date, read time, tags) | **main column** (readable width) | right **sticky TOC rail**. Mobile: single column, stacked — title → meta → inline TOC → body; sticky rail hidden.

## 3. Theming (light/dark)

- Light: white background. Dark: near-black. One component set for all 8 screens.
- **SSR-safe persistence**: theme read from a **cookie** in `+layout.server.ts`, applied as `data-theme="light|dark"` on `<html>` → no flash-of-wrong-theme. Initial default follows `prefers-color-scheme`. Toggle flips attribute instantly + persists cookie.
- Tailwind v4 custom variant:
  ```css
  @custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
  ```
- Components use `bg-surface dark:bg-surface-dark` style utilities; no JS-conditional class logic.

### Design tokens (`@theme` in `src/app.css`)

```css
@theme {
	--container-page: 1120px; /* max-w-page */
	--color-surface: #ffffff; /* light bg */
	--color-surface-dark: #0a0a0a; /* near-black bg */
	--color-ink: ...; /* primary text */
	--color-ink-muted: ...; /* previews, meta rail, footer */
	--color-border-subtle: ...; /* pill/toggle borders, hairlines */
	--radius-pill: ...; /* search pill */
	--radius-dialog: ...; /* rounded search dialog */
	--font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
	--font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

(Exact values extracted from the Flowstep screens via `get-screen-jsx` during milestone 1.)

## 4. API Contract (REST, driven by BE)

Content arrives at **runtime from the BE** (not build time). One typed client interface; mock vs real swapped by `PUBLIC_API_BASE` env — swapping to the real BE must require zero other FE changes.

```
GET /api/posts?offset&limit&tag    → { total, items: PostSummary[] }   // tag = optional BE-side filter
GET /api/posts/:slug               → { ...PostSummary, tags, content }
GET /api/search/suggest?q&limit    → { results: PostSummary[] }
GET /api/photos                    → { total, items: Photo[] }        // /gallery masonry
GET /api/photos/featured           → Photo | 404                      // homepage hero photo (null-tolerant)

PostSummary = {
  slug: string
  title: string
  subtitle: string       // secondary headline; shown alongside title in listings
  preview: string        // BE-owned display text (article opening ok); FE line-clamps visually
  date: string           // ISO
  readTime: number       // minutes
  thumbnail: string | null   // null ⇒ list rows render title + preview only
}

Photo = { src, alt, width, height }   // natural dimensions; mixed aspect ratios on purpose
```

Rules:

- **FE renders BE payloads as-is** — no post-processing of any data (articles, list, search, suggestions): no FE-side sorting, filtering, or derived fields. Curation (e.g., "Selected writing") is expressed by the BE in its response.
- **Article meta is JSON fields, not frontmatter embedded in Markdown** — list/search views must show title/date/readTime/thumbnail without fetching or parsing full content. (If BE stores frontmatter, BE parses it.)
- **readTime is computed by the BE** at publish time, never in the FE.
- Mock adapter ships fixture data mirroring the mockups (greeting, Selected writing list, "queue" search results with unsplash `d55a2c14` / `d24cecb6` thumbnails, sample article with sections/quote/Further reading) until BE is live.

## 5. Search & Suggestion (BE-driven)

**Command palette dialog**, matching Screens 1/5:

- Opens: `Mod+K` / `Ctrl+K` globally · click pill (desktop) · tap icon button (mobile).
- Dialog: centered rounded card (`max-w-xl` desktop; `inset-x-3` near-full-width sheet on mobile), over **dimmed + softly blurred** background (`backdrop-filter: blur`), approximating the pill-zoom transition.
- Focused input on open (mount-time `focus()` — the `autofocus` attribute no-ops on dynamic dialogs); results render **below the input** inside the dialog.
- Per keystroke: **200ms debounce** → `suggestPosts` (`/api/search/suggest`, capped 8), guarded by a **monotonic request sequence** (stale responses dropped — `suggestPosts` takes no AbortSignal).
- Result row: small thumbnail (when present), title, 1–2 line preview, date + read time. Enter/click → `/posts/:slug`.
- **"See all" hand-off:** when a query is present the palette shows a trailing `→ See all results for "…"` row; it is part of the arrow-key selection (index === results.length) and Enter (with nothing selected / on that row) navigates to `/search?q=`. The palette stays a capped launcher; full, paginated, shareable results live on `/search`.
- States: loading skeletons · "No results for …" empty state (the See-all row still shows, so the query is never a dead end).
- A11y: `role="dialog"`, `aria-modal`, focus trap, `Esc` closes, focus restored to trigger.
- Full results (`/search`): `GET /api/search?q&offset&limit` → ranked, paginated `PostListResponse` with `total`; the page has its own GET search form and preserves the filter across pagination.

## 6. Markdown Rendering Pipeline (server-side, in `+page.server.ts`)

1. **Parse**: markdown-it + anchor plugin (heading slugs) + tables, strikethrough, task lists. **Authoring directives**: `::: grid … :::` → Pinterest-style masonry (`columns-2 md:columns-3`, natural aspect ratios, uniform gutters, items never split across columns). Author images as separate paragraphs (blank line between); the FE additionally forces `display: block` so single-paragraph authoring still staggers. Unknown `:::name` blocks stay plain text, so content degrades gracefully.
2. **Highlight**: Shiki fence override, `themes: { light, dark }` dual mode → CSS-variable spans.
3. **Sanitize**: DOMPurify (jsdom) before serialization — always, regardless of source.
4. **TOC extraction**: from markdown-it tokens (h2/h3 + anchor ids) → JSON. FE renders both the inline TOC under the title and the right sticky rail. This is a **rendering step, not data post-processing** — derived while parsing the article Markdown, like highlighting; the BE does not send a TOC field.
5. Render via `{@html}` inside `.prose`.
6. **Post-render enhancement** (Svelte action on the container): **Wrap | Copy icon toolbar** (Lucide glyphs) on `<pre>` blocks, hidden until hover/keyboard focus (always visible on touch); wrap toggles `white-space: pre-wrap` via `.code-wrap`; Copy requires async clipboard. `loading="lazy"` on `<img>`, IntersectionObserver for active-TOC-entry highlighting. **Heading anchors**: hover-revealed Lucide `link` icon (18px) left of every h2/h3 that copies the direct `URL#id` link (same fade/blur language). **Inline images**: click-to-zoom via the shared `ImageLightbox` (same dialog as the gallery).

Perf — Shiki bundled language set (confirmed): `go, rust, clojure, javascript, typescript, python, bash, yaml, json, dockerfile, hcl`. (K8s manifests = `yaml`; Terraform = `hcl`; all bundled grammars, no external loads.) ~11 grammars keeps server cold-start light.

## 7. Deliberate raw-CSS exceptions (everything else is Tailwind utilities)

1. `.prose` overrides for markdown content (outside Svelte scope) — layered on `@tailwindcss/typography`.
2. Shiki `--shiki-light` / `--shiki-dark` variable mapping so code colors flip with `data-theme`.
3. Zoom-in keyframe (`.dialog-zoom`) shared by the gallery lightbox and the future search dialog.
4. Theme-switch circular reveal — `::view-transition-*(root)` + `theme-reveal` keyframes (View Transitions API; pseudo-elements not reachable via utilities).
5. Slim themed horizontal scrollbar (`.scroll-slim` + `.prose pre`) — photo strip, overflowing code blocks and masonry gutters; pseudo-elements aren't reachable via utilities.
6. Route-change progress bar (`.route-progress`) — fixed 2px brand-violet bar; active/finishing/idle phases driven by `$app/state navigating` (minimum visible beat for preloaded instant navigations; hash-only jumps excluded).
7. Entrance choreography (`.fade-up`) — staggered opacity/translateY rise for homepage sections (per-section `animation-delay`; reduced-motion off-switch).

## 8. Responsive matrix

| Area           | Mobile `< md`/`< lg`                                                                                                                                                                                         | Desktop                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Container      | `px-4/6` gutters                                                                                                                                                                                             | 1120px centered, generous margins                 |
| Navbar search  | icon-only rounded-square button                                                                                                                                                                              | pill + label + `Mod+K` kbd                        |
| Article layout | single column: title→meta→inline TOC→body; sticky rail hidden                                                                                                                                                | meta rail / main / sticky TOC grid                |
| Search dialog  | `inset-x-3` sheet                                                                                                                                                                                            | centered `max-w-xl` card                          |
| Home list      | section opens with a serif "Writing" heading; rows: mono date·read-time masthead **above** a Fraunces serif title (violet underline grows on hover), subtitle, 3-line clamped preview; small right thumbnail | same, wider gaps; row hover fills `accent/40`     |
| Photography    | `/gallery` only: 2-col masonry (home strip removed in the consolidation)                                                                                                                                     | `/gallery`: 3-col masonry                         |
| Writing header | —                                                                                                                                                                                                            | home: horizontal strip; `/gallery`: 3-col masonry |
| Footer         | wraps/stacks                                                                                                                                                                                                 | single constrained row                            |

Rules: consistent `md`/`lg` breakpoints; differences handled with visibility variants (`hidden md:flex` pill ↔ `md:hidden` icon button, `hidden lg:grid` rails), **never** duplicate mobile/desktop components except where markup genuinely differs. Touch targets ≥44px. QA against all 8 screens (light/dark automatic via tokens; desktop/mobile via variants).

## 9. Deployment

- `adapter-node` → small Docker container on the K3s cluster (matches reserved 256Mi/512Mi budget).
- Config via env: `PUBLIC_API_BASE`.
- RSS link points at BE `/feed.xml` (placeholder until BE exists).
