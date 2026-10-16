# Personal Blog FE — Design Document

> UI source of truth: Flowstep file `f82d3fbc-3f1e-4f24-ac48-e19143ccb2fa` (8 screens:
> light/dark × homepage/article × desktop/mobile, plus mobile light/dark variants).
> Note: `/home/fzr/Projects/personal-blog/DESIGN.md` is the backend K3s infra blueprint — unrelated to this FE design.

## 1. Stack

| Concern            | Choice                                                                                                             | Rationale                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Framework          | **Svelte 5 + SvelteKit** (TypeScript, Vite)                                                                        | Small bundle, great interactions (search palette), file-based routing, SSR                                              |
| Fonts              | **Inter** (variable, self-hosted `@fontsource-variable/inter`) + **JetBrains Mono** (`@fontsource/jetbrains-mono`) | Closest free match to mockup grotesque; self-hosted = no external request/FOUT. Alts: Geist Sans, Atkinson Hyperlegible |
| Rendering          | **SSR** via `adapter-node`                                                                                         | SEO (articles crawlable), server-side API fetch in load functions, fits K3s 256/512Mi backend container budget          |
| Styling            | **Tailwind CSS v4** (`@tailwindcss/vite`)                                                                          | Config lives in CSS (`@theme`), no `tailwind.config.js`; minimal raw CSS (~4 exceptions, §7)                            |
| Markdown           | **markdown-it** + `markdown-it-anchor` (+ tables/strikethrough/task-lists)                                         | Runtime content from API ⇒ mdsvex (build-time) is not applicable; token access powers TOC/anchors                       |
| Sanitization       | **DOMPurify** (`isomorphic-dompurify`, server-side)                                                                | Mandatory — API content treated as untrusted                                                                            |
| Code highlighting  | **Shiki, server-side**, dual-theme mode (`themes: { light, dark }`)                                                | VS Code-grade grammars; client ships plain highlighted HTML; theme flips via CSS vars without refetch                   |
| Article typography | `@tailwindcss/typography` as base, overridden to match mockups                                                     | Avoids hand-writing prose CSS                                                                                           |
| Formatting         | Prettier + `prettier-plugin-svelte` + `prettier-plugin-tailwindcss`, ESLint                                        | Class-order consistency                                                                                                 |

## 2. Pages & Layout

| Route           | Content                                                                                                                                                                                                                                                                                   | Screens             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `/`             | Greeting + headline (decorative line-art SVG right on desktop), "Selected writing" list with optional thumbnails (**BE-curated**; FE renders payload as-is), "Photography" teaser strip (fixed-height crops, links to `/gallery`). **No hero search field** — search lives only in navbar | 1 (light), 5 (dark) |
| `/articles`     | All articles, SSR-paginated (`?page=N`, size 10, Newer/Older + "Page X of Y"); **card grid** (`sm:2 lg:3` cols, `ArticleCard`) — top `aspect-video` thumbnail when present, title, clamped preview, meta pinned bottom. Homepage keeps the editorial list rows (`PostCard`)               | —                   |
| `/gallery`      | Full mixed-aspect masonry grid (`columns-2 md:columns-3`, lazy, reserved dimensions) — the interesting mis-aligned rows live here, not on the homepage                                                                                                                                    | —                   |
| `/about`        | Static FE bio page (hero-style header + paragraphs); trivially movable to BE-driven later                                                                                                                                                                                                 | —                   |
| `/posts/[slug]` | Title + description, breadcrumb below (`Home / Articles / <title>`), metadata, inline TOC, body sections, quote, "Further reading". **No comments/Discussion section**                                                                                                                    | 2 (light), 6 (dark) |
| (future)        | RSS redirect to BE `/feed.xml`                                                                                                                                                                                                                                                            | —                   |

Layout shell (all pages):

- **Container**: centered `max-w-page` (1120px) with generous equal side margins; content never stretches to full viewport. Mobile: `px-4`/`px-6` gutters.
- **Navbar**: wordmark (minimal) + **4 links (Home · Articles · Gallery · About)** with pathname-derived active state (`aria-current="page"`) + **Search pill** + **Theme toggle**.
- **Mobile nav**: links collapse into a **hamburger** (`md:hidden`); icon button toggles a dropdown panel under the header with stacked links; closes on link click, `Esc`, outside tap, and on navigation; `aria-expanded`/`aria-controls`.
- **Search pill (desktop)**: bordered rounded pill, magnifier icon, label "Search", visible `Mod+K` kbd hint.
- **Search (mobile)**: compact bordered **rounded-square icon-only button** (magnifier only; no label, no kbd hint). Pill hidden on mobile; icon button hidden on desktop. Icon button + theme toggle fit on one mobile header row, ≥44px touch targets.
- **Theme toggle**: bordered rounded button beside search; **sun icon in light state, moon icon in dark state**.
- **Footer**: `© 2024 Felix` + **only** GitHub, LinkedIn, RSS hyperlinks (no Elsewhere, no status sentence). Single row on desktop; wraps/stacks on mobile (`flex-wrap gap`).

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
GET /api/posts?offset&limit        → { total, items: PostSummary[] }
GET /api/posts/:slug               → { ...PostSummary, tags, content }
GET /api/search/suggest?q&limit    → { results: PostSummary[] }
GET /api/photos?limit=6            → { total, items: Photo[] }        // homepage teaser strip
GET /api/photos                    → { total, items: Photo[] }        // full masonry on /gallery

PostSummary = {
  slug: string
  title: string
  preview: string        // 1–2 lines
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
- Focused input on open; results render **below the input** inside the dialog.
- Per keystroke: **200ms debounce** → `AbortController`-guarded fetch of `/api/search/suggest`.
- Result row: small thumbnail (unsplash), article title, 1–2 line preview, date + read time. Enter/click → `/posts/:slug`.
- States: loading skeletons · "No results for …" empty state.
- A11y: `role="dialog"`, `aria-modal`, focus trap, `Esc` closes, focus restored to trigger.

## 6. Markdown Rendering Pipeline (server-side, in `+page.server.ts`)

1. **Parse**: markdown-it + anchor plugin (heading slugs) + tables, strikethrough, task lists.
2. **Highlight**: Shiki fence override, `themes: { light, dark }` dual mode → CSS-variable spans.
3. **Sanitize**: DOMPurify (jsdom) before serialization — always, regardless of source.
4. **TOC extraction**: from markdown-it tokens (h2/h3 + anchor ids) → JSON. FE renders both the inline TOC under the title and the right sticky rail. This is a **rendering step, not data post-processing** — derived while parsing the article Markdown, like highlighting; the BE does not send a TOC field.
5. Render via `{@html}` inside `.prose`.
6. **Post-render enhancement** (Svelte action on the container): **Wrap | Copy toolbar** on `<pre>` blocks (wrap toggles `white-space: pre-wrap` via `.code-wrap`; Copy requires async clipboard), `loading="lazy"` on `<img>`, IntersectionObserver for active-TOC-entry highlighting.

Perf — Shiki bundled language set (confirmed): `go, rust, clojure, javascript, typescript, python, bash, yaml, json, dockerfile, hcl`. (K8s manifests = `yaml`; Terraform = `hcl`; all bundled grammars, no external loads.) ~11 grammars keeps server cold-start light.

## 7. Deliberate raw-CSS exceptions (everything else is Tailwind utilities)

1. `.prose` overrides for markdown content (outside Svelte scope) — layered on `@tailwindcss/typography`.
2. Shiki `--shiki-light` / `--shiki-dark` variable mapping so code colors flip with `data-theme`.
3. Zoom-in keyframe (`.dialog-zoom`) shared by the gallery lightbox and the future search dialog.
4. Slim themed horizontal scrollbar (`.scroll-slim` + `.prose pre`) — photo strip and overflowing code blocks; pseudo-elements aren't reachable via utilities.

## 8. Responsive matrix

| Area           | Mobile `< md`/`< lg`                                          | Desktop                                           |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| Container      | `px-4/6` gutters                                              | 1120px centered, generous margins                 |
| Navbar search  | icon-only rounded-square button                               | pill + label + `Mod+K` kbd                        |
| Article layout | single column: title→meta→inline TOC→body; sticky rail hidden | meta rail / main / sticky TOC grid                |
| Search dialog  | `inset-x-3` sheet                                             | centered `max-w-xl` card                          |
| Home list      | stacked rows, inline meta; thumbnail above title when present | 12-col rows; optional thumbnail column            |
| Photography    | home: horizontal strip; `/gallery`: 2-col masonry             | home: horizontal strip; `/gallery`: 3-col masonry |
| Footer         | wraps/stacks                                                  | single constrained row                            |

Rules: consistent `md`/`lg` breakpoints; differences handled with visibility variants (`hidden md:flex` pill ↔ `md:hidden` icon button, `hidden lg:grid` rails), **never** duplicate mobile/desktop components except where markup genuinely differs. Touch targets ≥44px. QA against all 8 screens (light/dark automatic via tokens; desktop/mobile via variants).

## 9. Deployment

- `adapter-node` → small Docker container on the K3s cluster (matches reserved 256Mi/512Mi budget).
- Config via env: `PUBLIC_API_BASE`.
- RSS link points at BE `/feed.xml` (placeholder until BE exists).
