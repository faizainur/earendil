# Personal Blog (FE) — `fzr;`

SvelteKit frontend for the Markdown-driven personal blog of **Faiz Ainur Rofiq** (`fzr;` = his stylized initials). Content is served by a REST BE (`cms.`, contract in [DESIGN.md §4](DESIGN.md)); an in-repo mock layer runs until it exists — flip with `PUBLIC_API_BASE`.

**Canonical URL: `https://blog.ainurrofiq.com`** (subdomain & TLS plan in DESIGN.md §9).

## What's here

| Route           | What                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | Identity hero (Fraunces headline + featured photograph) and the full post list, SSR-paginated                                          |
| `/posts/[slug]` | SSR markdown → Shiki dual-theme code, TOC rails, copy/wrap tools, heading-anchor copy-links, zoomable images, `::: grid` photo masonry |
| `/search`       | Results page — `?q=` text search or `?tag=` browsing, paginated, noindex on queries                                                    |
| `/gallery`      | Full Pinterest-style masonry with lightbox                                                                                             |
| `/about`        | Static bio                                                                                                                             |

Plus: **⌘K / `Mod+K` command palette** (capped launcher with see-all hand-off), cookie-persisted light/dark (View-Transitions cross-fade), brand-violet route progress bar, staggered fade entrances, animated mobile hamburger.

**Stack:** Svelte 5 + SvelteKit (Kit 3) + TypeScript · Tailwind v4 (semantic token palette, ~7 deliberate raw-CSS exceptions) · markdown-it pipeline (anchors, task lists, container directive) + Shiki + DOMPurify · vitest. Docs: [DESIGN.md](DESIGN.md) (living spec) · [PLAN.md](PLAN.md) (milestones & status) · [ARCHITECTURE.md](ARCHITECTURE.md) (backend K3s blueprint).

## Live preview

Start the dev server with hot reload (edits appear instantly, no manual refresh):

```sh
npm install        # first time only
npm run dev        # http://localhost:5173
```

**On your phone / another machine (responsive QA):** bind to the network and open the printed LAN URL from the terminal:

```sh
npm run dev -- --host
# → Network: http://192.168.x.x:5173  (same Wi-Fi required)
```

**Behind a remote box (SSH / VS Code):** forward the port instead of binding it —
VS Code's _Ports_ tab auto-detects `5173`; over plain SSH use `ssh -L 5173:localhost:5173 <host>`.

**Production preview** (what the deployed container will actually serve):

```sh
npm run build
npm run preview    # http://localhost:4173  (--host works here too)
```

Other commands: `npm run check` (svelte-check), `npm run lint` (prettier + eslint), `npm run test:unit` (vitest).

Theme check: flip the sun/moon toggle in the navbar, reload — the choice persists via cookie and is applied before first paint (no light/dark flash).

## Env

| Var               | Meaning                                                       | Unset behavior     |
| ----------------- | ------------------------------------------------------------- | ------------------ |
| `PUBLIC_API_BASE` | REST BE base URL (in-cluster service URL in production)       | mock fixture layer |
| `PUBLIC_SITE_URL` | canonical origin (used for RSS/canonical absolutes at deploy) | reserved for M8    |

## Re-creating the scaffold

```sh
npx sv@1.1.1 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:typography" --install npm
```

Then: wire `@tailwindcss/vite`, the semantic token palette + `data-theme` dark variant (`src/routes/layout.css`), self-hosted fonts (`@fontsource-variable/inter`, `@fontsource/jetbrains-mono`, `@fontsource-variable/fraunces` + wonk-italic), and `lucide-svelte`.
