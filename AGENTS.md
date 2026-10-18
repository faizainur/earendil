# AGENTS.md — `earendil` working guide for AI agents

Orientation + load-bearing rules + hard-won lessons, so you don't re-derive (or regress)
decisions already made. The repo's own history is the source of truth for WHY; this file is
the index.

## 1. What this repo is (60 seconds)

- **SvelteKit 3** (Svelte 5 runes, Vite 8) SSR blog frontend via **`adapter-node`** →
  containerized on a K3s cluster. Workspace parent (`../`) holds the infra: `AGENTS.md`
  (non-negotiables: no secrets in Git, one public ingress = this frontend),
  `INFRA_ARCHITECTURE.md` (blueprint), `k8s-platform-manifests/` (GitOps), `backend/`
  (API contract mirror of `src/lib/api/client.ts`).
- Content arrives **at runtime from a REST backend**; until the BE exists, the in-repo
  **mock layer is the data source of truth** (`createApi(undefined)` → fixtures). Dev and
  tests must work with no cluster and no backend.
- Mermaid diagrams render **client-side** (adopted design, "Route B" — see §7).
- UI source of truth: Flowstep file id in `DESIGN.md` header (8 screens, light/dark ×
  desktop/mobile).

## 2. How to analyze this repo — read in this order

1. `git log --oneline -15` — the themes of recent work (diagrams, lightbox gestures, mobile
   perf fixes).
2. **`DESIGN.md`** — living spec: stack, routes, theming, API contract, markdown pipeline,
   the 7 raw-CSS exceptions, deployment. Most "why is it like this?" questions answer here.
3. **`PLAN.md`** — round-by-round journal with decision records (append-only history; don't
   rewrite old entries, add "Refined/Decision" notes).
4. Code spine: `src/routes/+layout.svelte` → a page's `+page.server.ts` (SSR load) →
   `src/lib/api/` → `src/lib/markdown/render.ts` → `src/lib/actions.ts` (all post-render
   interactivity) → `src/lib/components/`.
5. `README.md` is user-facing (routes, how to run) — rarely the place to look for internals.

Don't start by grepping everything: DESIGN/PLAN already encode most decisions.

## 3. Commands

| Need                 | Command                             | Notes                                                    |
| -------------------- | ----------------------------------- | -------------------------------------------------------- |
| Dev server           | `npm run dev`                       | mock data by default; `-- --host` for LAN QA             |
| Type/component check | `npm run check`                     | svelte-check; must be 0/0                                |
| Lint                 | `npm run lint`                      | `prettier --check . && eslint .` — **run it standalone** |
| Tests                | `npm run test:unit`                 | vitest, node env (no jsdom) — 4 files / 32 tests         |
| Format               | `npx prettier --write <paths>`      | then re-run lint                                         |
| Build / preview      | `npm run build` / `npm run preview` | adapter-node output in `build/`                          |

**Always, after touching `src/`:** `prettier --write` → `npm run lint` → `npm run check` →
`npm run test:unit` → `npm run build`. Lint must exit 0 on its own — piping through `tail`
and eyeballing produced multiple false "it passed" moments in this repo's history.

Formatting facts: Prettier with **tabs**, single quotes, width 100, no trailing commas,
`prettier-plugin-svelte` + `prettier-plugin-tailwindcss` (`tailwindStylesheet` must keep
pointing at `src/routes/layout.css`). Editors WITHOUT the prettier config have twice
reformatted whole files tabs→spaces (`mock.ts`): if a diff looks like pure whitespace
churn, `git checkout -- <file>` and redo the content edit.

## 4. Git workflow (strict)

- **Never commit directly to `master`.** One branch per milestone/round (`feature/<slug>`,
  historically `milestone/<n>-<slug>`), human reviews and merges.
- **Club related changes into ONE commit** — never one commit per file, no micro-commits.
  Conventional Commit subject (`feat|fix|docs|perf(scope): …`) with a WHY body.
- Unmerged branches: `feature/a-inline-diagrams` (the rejected Route A diagram design —
  keep for reference, don't delete without asking), `feature/interactive-diagrams`
  (stale doc branch).
- Verify edits landed on disk (grep/diff) rather than trusting a transcript — tool output
  in long sessions has been phantom more than once.

## 5. Layout map

```
vite.config.ts                  sveltekit() + tailwind plugin + adapter-node(out: build)
                                + server.allowedHosts (ngrok suffix wildcards, §9)
src/app.html                    html shell — <noscript> restores mermaid source (don't delete)
src/env.ts                      defineEnvVars: PUBLIC_API_BASE (browser), API_BASE (server-only)
src/routes/+layout.server.ts    reads theme cookie → data.theme
src/routes/+layout.svelte       shell, pre-paint theme script, toggleTheme (View Transition),
                                route-progress bar state machine
src/routes/layout.css           @theme tokens (--brand, --diagram-* light/dark) + the 7 raw-CSS
                                exceptions (DESIGN §7) + Shiki var mapping + prose overrides
src/routes/api/[...path]/       SAME-ORIGIN PROXY: browser GET /api/… → API_BASE (no public API!)
src/routes/{,search,gallery,about,posts/[slug]}/  pages; loads call #lib/api/server.ts
src/lib/api/client.ts           BlogApi interface (CONTRACT SOURCE OF TRUTH) + createApi + ApiError
src/lib/api/server.ts           server-only api singleton; API_BASE resolution chain
src/lib/api/index.ts            client-safe entry (mock-aware) — what components import
src/lib/api/mock.ts             fixture corpus: 12 posts (2 pages), photos, 3 mermaid fences
src/lib/markdown/render.ts      markdown-it chain: anchors, ::: grid, task-lists, Shiki fence
                                override (dual-theme CSS vars), mermaid-fence intercept
src/lib/actions.ts              ALL post-render interactivity (see §6/§7) + MERMAID_VARS/RAMP
src/lib/components/             ImageLightbox (pinchZoom+caption retract), SearchDialog (⌘K),
                                Navbar, ThemeToggle, ArticleTOC, PostCard, PhotoGallery, …
src/lib/*.test.ts, markdown/*.test.ts, api/*.test.ts   see §8
```

## 6. Load-bearing conventions

1. **FE renders BE payloads as-is** — no FE sorting/filtering/derived fields; curation is
   the BE's job (list order, featured photo, tags). Exceptions are _rendering_ steps, not
   data processing: TOC extraction, Shiki highlighting, mermaid fences.
2. **Runtime env only** — nothing build-time-inlined (`VITE_*` is banned for anything that
   differs per deploy). Server: `process.env.API_BASE`; browser: `PUBLIC_API_BASE="/"`
   riding the same-origin proxy. `$app/env/private` is server-only — never import it from
   shared code (breaks client build); that's why server code uses `#lib/api/server.ts` and
   components use `#lib/api/index.ts`.
3. **The API has no public ingress, ever** (workspace design). Browser→API traffic MUST ride
   `routes/api/[...path]` through the SSR pod. Don't "fix" a failing direct API call by
   exposing the BE.
4. **Mock-first** — `createApi(undefined)` → fixtures. New endpoints: extend `BlogApi` +
   `mock.ts` together; contract test (`api.test.ts`) and dev mode must keep working offline.
5. **Versions are pinned where it matters** (`mermaid` is exact-pin `12.2.0`); upgrading
   mermaid requires re-auditing theming (§7) — v12 changes were the whole theme story.
6. **Mobile perf budget**: prefer composited animations (opacity/transform on small
   layers). Viewport-sized clip-path = jank (it cost the theme "bloom" its life, §7).

## 7. The diagram subsystem (Route B) — most subtle area

Flow: ` ```mermaid ` fence → **Shiki bypass in `render.ts`** → `<pre class="mermaid-src">
<code>escaped source</code></pre>` → SSR placeholder **is the shimmer skeleton** (pure CSS
from first paint: surface bg, `::after` sweep via `diagram-shimmer` keyframes, code
`visibility: hidden`) → on hydration, `mermaidDiagrams` action (`actions.ts`) sets
`aria-busy`, lazy-`import('mermaid')`, renders each fence → swaps in `span.diagram`.
Click → `svgForZoom` (bakes viewBox→px width/height; SVG-as-`<img>` has no intrinsic size)
→ data URL → shared `ImageLightbox`. A `data-theme` MutationObserver re-renders everything.
Failure paths: parse error → `.mermaid-failed` reveals the source (dashed); JS off →
`<noscript>` in `app.html` reveals the source. **The escaped source is the DOM's ground
truth** — never remove it from SSR output.

**Theming contract** (violating any line regresses the look — `theming.contract.test.ts`
guards what it can):

- `layout.css` `--diagram-*` tokens are the ONLY color source; JS (`MERMAID_VARS`/`RAMP`
  tables in `actions.ts`) holds **zero** color values, no scattered hex fallbacks (missing
  token ⇒ dev console warning).
- **Neutrals only** from tokens (background/ink/muted line). The primary/secondary/tertiary
  trio is deliberately unmapped: entity colors cycle the **theme's** built-in 12-hue
  `borderColorArray`/`bkgColorArray` — that per-box variance IS the adopted look.
- Theme = `redux-color` / `redux-dark-color` picked by mode; `look` unset (the 10
  categorical diagram types pair with the `neo` look, chart types with `classic` — each
  family internally consistent); `darkMode` derived from `data-theme` (flips derived-tone
  math direction). `theme: base` is obsolete here: the redux themes honor `themeVariables`
  via `x = x || derived` guards.
- Categorical _chart_ series (variable-driven, not array-cycled) come from `RAMP` →
  `pie1–4` (1-based!), `git0–3`, `fillType0–3`, `series0–3`, `cScale0–3`. Don't enumerate
  more — mermaid derives everything else.
- Mermaid **reads hex only** (`red`/`oklch()` are silently ignored — the contract test
  enforces the tokens). `themeCSSVariables` does NOT exist in 12.2.0; re-render-on-flip is
  the sync mechanism.
- The pipeline is **diagram-type-agnostic** (fence rule keys on the `mermaid` info string);
  new types need no FE change. The backend ships raw fences — **no publish render pipeline**
  (the mirror BE doc: `../backend/DESIGN.md`).

## 8. Tests — what protects what

| File                               | Invariant                                                 |
| ---------------------------------- | --------------------------------------------------------- |
| `src/lib/api/api.test.ts`          | mock corpus shape matches `BlogApi` (counts, edges, 404s) |
| `src/lib/markdown/render.test.ts`  | fence/anchor/TOC/`::: grid`/mermaid-placeholder pipeline  |
| `src/lib/diagram-zoom.test.ts`     | `svgForZoom` bakes intrinsic size; idempotent             |
| `src/lib/theming.contract.test.ts` | `--diagram-*` hex-only + light/dark parity + mapping refs |

Vitest runs in **node env without DOM** — don't write tests that need `document`; actions
are manually verified (§9).

## 9. Manual QA recipes

- Diagrams: `/posts/shape-of-a-useful-queue` (flowchart), `/posts/when-latency-becomes-a-product-decision`
  (sequence), `/posts/observability-is-a-contract` (pie). Hard-refresh throttled to Fast 3G →
  shimmer from first paint (never raw source), theme-flip mid-render.
- Phone via ngrok: `npm run dev` + `ngrok http 5173` — `*.ngrok-free.app` / `*.ngrok.app`
  already in `server.allowedHosts` (suffix wildcards survive hostname regeneration; one-off
  hosts: `ALLOWED_HOSTS=a,b npm run dev`). Don't hardcode tunnel hostnames.
- Code tools: tap-to-reveal only on `(hover: none)` devices; toolbar is anchored to a
  non-scrolling wrapper — verify it stays put when you swipe a long line (it regressed once).
- Lightbox: pinch/pan/double-tap on photos and diagram zooms; caption fades while zoomed;
  backdrop tap/Esc/X still close (backdrop only reacts to `e.target === e.currentTarget`).

## 10. Hard-won lessons (each cost a real bug fix — don't regress)

1. **Svelte actions run at hydration, not first paint.** Anything user-visible before JS
   must be pure CSS in the SSR output (the diagram shimmer was moved there after phones
   showed seconds of raw mermaid source).
2. **An absolute child of an `overflow-x` scroller is positioned against the unscrolled
   box and scrolls away with the content.** Pin overlays to a wrapper div, not the scroller
   (code-block toolbar). The same reason the shimmer uses `overflow: hidden`.
3. **View Transitions:** put gesture transforms on the `<img>`, enter/exit transitions on the
   parent `<figure>` — separate elements, no conflict. A `clip-path` sweep re-rasters the
   viewport snapshot per frame → retired on 60Hz reality; the UA cross-fade is composited.
4. **SVG as `<img>` src needs intrinsic width/height** — `viewBox` + `max-width` styling is
   inline-only (`svgForZoom` bakes px from the viewBox).
5. **Touch reveals:** `matchMedia('(hover: none)')` gates tap-toggle behavior; blur buttons
   on pointer-activation (`e.detail > 0`) so focus doesn't pin UI open.
6. **Tailwind v4 scans .ts/.svelte sources** — utilities applied via string classlists
   (`cursor-zoom-in`) are generated, but ONLY if the literal appears somewhere scanned.
   Missing utility styles → check the spelling exists in source.
7. `autofocus` no-ops on dynamically mounted dialogs — use the `focusOnMount` action.

## 11. Explicitly do NOT

- Add a public ingress or CORS for the API (design rule §6.3), or "fix" `/api/...` 404s by
  exposing the backend — the proxy or `API_BASE` is the bug.
- Do FE-side sorting/filtering/derived fields on BE payloads.
- Put color literals in `actions.ts`/components, map mermaid's primary/secondary/tertiary
  trio, or enumerate per-diagram theme vars beyond `MERMAID_VARS`/`RAMP`.
- Re-add the theme-switch bloom, or delete `feature/a-inline-diagrams` / the `<noscript>`
  block / the escaped-source fallback without asking.
- Commit to `master`, or split a logical change across micro-commits.
- Trust in-session "done" claims — grep the files.
