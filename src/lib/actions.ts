/**
 * Client-side enhancement actions for rendered Markdown bodies (DESIGN.md §6.6):
 * copy + wrap-toggle buttons on `<pre>` blocks, heading anchor copy-links,
 * lazy images, and scroll-synced TOC highlighting.
 */

/**
 * Adds a "#" copy-link button to the left of every h2/h3 with an id (set by
 * markdown-it-anchor). Hidden until the heading is hovered or focused — same
 * 100ms fade language as the code toolbar; pointer clicks blur so hover-out
 * reveals cleanly again. No-ops when the async clipboard is unavailable.
 */
export function headingAnchors(node: HTMLElement) {
	if (!navigator.clipboard) return;

	const buttons: HTMLAnchorElement[] = [];

	for (const heading of Array.from(node.querySelectorAll<HTMLElement>('h2[id], h3[id]'))) {
		const button = document.createElement('a');
		button.href = `#${heading.id}`;
		button.innerHTML = LINK_ICON;
		button.setAttribute('aria-label', `Copy link to section: ${heading.textContent ?? ''}`);
		button.className =
			'heading-anchor absolute -left-8 top-1/2 hidden size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity duration-100 ease-out hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100 lg:flex';
		button.addEventListener('click', (e) => {
			e.preventDefault();
			const url = `${location.origin}${location.pathname}#${heading.id}`;
			navigator.clipboard.writeText(url).then(
				() => {
					button.innerHTML = CHECK_ICON_MD;
					setTimeout(() => (button.innerHTML = LINK_ICON), 2000);
				},
				() => {
					/* clipboard rejected — leave idle */
				}
			);
			if (e.detail > 0) button.blur();
		});
		heading.classList.add('relative', 'group');
		heading.appendChild(button);
		buttons.push(button);
	}

	return {
		destroy() {
			for (const button of buttons) button.remove();
		}
	};
}

const pill =
	'flex size-7 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors hover:text-foreground';

const svg = (inner: string, size = 'size-3.5') =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${size}" aria-hidden="true">${inner}</svg>`;

// Lucide icon paths (same set the rest of the site renders via lucide-svelte).
const COPY_ICON = svg(
	'<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'
);
const CHECK_PATH = '<path d="M20 6 9 17l-5-5"/>';
const CHECK_ICON = svg(CHECK_PATH);
const CHECK_ICON_MD = svg(CHECK_PATH, 'size-[18px]');
const LINK_ICON = svg(
	'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
	'size-[18px]'
);
const WRAP_ICON = svg(
	'<path d="m16 16-3 3 3 3"/><path d="M3 12h14.5a1 1 0 0 1 0 7H13"/><path d="M3 19h6"/><path d="M3 5h18"/>'
);

/**
 * Adds an icon toolbar (Wrap | Copy, Lucide glyphs) to every `<pre>`, hidden until
 * the block is hovered or keyboard-focused (always visible on touch devices, see
 * layout.css). The Copy button is only mounted when the async clipboard is
 * available; wrapping works regardless.
 */
export function codeBlockTools(node: HTMLElement) {
	const toolbars: HTMLDivElement[] = [];

	for (const pre of Array.from(node.querySelectorAll('pre'))) {
		const toolbar = document.createElement('div');
		// Quick, understated fade both ways: 100ms ease-out reads as natural without the user noticing it.
		toolbar.className =
			'code-tools absolute top-2 right-2 flex gap-2 opacity-0 transition-opacity duration-100 ease-out group-hover:opacity-100 group-focus-within:opacity-100';

		const wrap = document.createElement('button');
		wrap.type = 'button';
		wrap.innerHTML = WRAP_ICON;
		wrap.title = 'Toggle line wrapping';
		wrap.setAttribute('aria-pressed', 'false');
		wrap.setAttribute('aria-label', 'Toggle line wrapping for this code block');
		wrap.className = `${pill} text-muted-foreground`;
		wrap.addEventListener('click', (e) => {
			const on = pre.classList.toggle('code-wrap');
			wrap.setAttribute('aria-pressed', String(on));
			wrap.classList.toggle('text-foreground', on);
			wrap.classList.toggle('text-muted-foreground', !on);
			// Pointer click: drop focus so hover-out hides the toolbar instantly (keyboard keeps it).
			if (e.detail > 0) wrap.blur();
		});
		toolbar.appendChild(wrap);

		if (navigator.clipboard) {
			const copy = document.createElement('button');
			copy.type = 'button';
			copy.innerHTML = COPY_ICON;
			copy.title = 'Copy code';
			copy.setAttribute('aria-label', 'Copy code to clipboard');
			copy.className = `${pill} text-muted-foreground`;
			copy.addEventListener('click', (e) => {
				navigator.clipboard.writeText(pre.textContent ?? '').then(
					() => {
						copy.innerHTML = CHECK_ICON;
						setTimeout(() => (copy.innerHTML = COPY_ICON), 2000);
					},
					() => {
						/* clipboard rejected (e.g. insecure context) — leave the button idle */
					}
				);
				if (e.detail > 0) copy.blur();
			});
			toolbar.appendChild(copy);
		}

		pre.classList.add('relative', 'group');
		pre.appendChild(toolbar);
		toolbars.push(toolbar);
	}

	for (const img of node.querySelectorAll('img')) {
		if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
	}

	return {
		destroy() {
			for (const toolbar of toolbars) toolbar.remove();
		}
	};
}

/**
 * Focuses the node on mount. The `autofocus` attribute is unreliable here:
 * browsers only honor it for the initial page render, not dynamically mounted
 * dialogs (Svelte inserts them after load).
 */
export function focusOnMount(node: HTMLElement) {
	node.focus();
}

/** mermaid themeVariable → CSS token. layout.css is the ONLY source of color —
 * change diagram colors there, never here. Mermaid derives every other
 * per-diagram var (clusterBkg, noteBkgColor, pie5+…) from these base entries,
 * so do NOT enumerate extras. Hard constraint: mermaid reads hex only
 * (#rgb/#rrggbb) — enforced by theming.contract.test.ts, not by review. */
const MERMAID_VARS = {
	background: '--diagram-bg',
	mainBkg: '--diagram-bg',
	primaryColor: '--diagram-surface',
	primaryTextColor: '--diagram-ink',
	primaryBorderColor: '--diagram-line',
	secondaryColor: '--diagram-accent',
	tertiaryColor: '--diagram-surface',
	lineColor: '--diagram-muted',
	textColor: '--diagram-ink'
} as const;

/** Categorical ramp (series that must be visually distinct) — layout.css owns the hues.
 *  `base` is each family's starting index: mermaid's pie vars are 1-based, the rest 0-based.
 *  Families: pie (pie charts), git (gitGraph branches), fillType (user-journey steps),
 *  series (xyChart bars/lines), cScale (quadrantChart + radar point colors).
 *  Everything else (clusterBkg, noteBkgColor, gantt sections, actor fills…) is
 *  left to mermaid's own derivation from the base palette — do not enumerate more. */
const RAMP = ['--diagram-cat-1', '--diagram-cat-2', '--diagram-cat-3', '--diagram-cat-4'] as const;
const RAMP_FAMILIES: Array<[string, number]> = [
	['pie', 1],
	['git', 0],
	['fillType', 0],
	['series', 0],
	['cScale', 0]
];

/**
 * Route B diagram rendering: hydrates `pre.mermaid-src` placeholders (emitted by
 * the markdown pipeline) with mermaid. The library is dynamically imported so its
 * chunk loads ONLY on pages that contain a diagram. JS visitors never see the raw
 * source: placeholders are swapped for a shimmer skeleton on the hydration tick,
 * while the escaped source remains the no-JS state and the per-diagram failure
 * fallback. Rendered diagrams are click-to-zoom through the page's ImageLightbox
 * (data-URL snapshot of the current SVG — mermaid bakes concrete hex colors into
 * its output, so an `<img>` renders it identically). Re-renders when `data-theme`
 * flips so diagrams follow the palette.
 */
export function mermaidDiagrams(
	node: HTMLElement,
	onZoom?: (image: { src: string; alt: string }) => void
) {
	const items = [...node.querySelectorAll<HTMLElement>('pre.mermaid-src')].map((pre) => ({
		src: pre.textContent ?? '',
		pre,
		host: pre, // placeholder → skeleton → rendered span
		rendered: false,
		svg: '' // current markup, snapshotted on zoom click
	}));
	if (items.length === 0) return;

	// Synchronous swap: the shimmer skeleton covers the lazy-chunk gap.
	for (const it of items) {
		const sk = document.createElement('span');
		sk.className = 'diagram-loading';
		sk.setAttribute('role', 'status');
		sk.setAttribute('aria-busy', 'true');
		sk.textContent = 'Loading diagram'; // announced by AT, painted over by CSS
		it.pre.replaceWith(sk);
		it.host = sk;
	}

	const restoreCode = (it: (typeof items)[number]) => {
		if (it.host !== it.pre) {
			it.host.replaceWith(it.pre);
			it.host = it.pre;
		}
		it.pre.classList.add('mermaid-failed'); // dashed border = "this was a diagram"
	};

	let disposed = false;
	let seq = 0;
	let ids = 0;

	/** The palette contract: read tokens, hardcode nothing. */
	function themeVariables(): Record<string, string | boolean> {
		const cs = getComputedStyle(document.documentElement);
		const vars: Record<string, string | boolean> = {
			// Mode flag, not a color: flips mermaid's derived-tone direction.
			darkMode: document.documentElement.dataset.theme === 'dark'
		};
		const font = cs.getPropertyValue('--font-sans').trim();
		if (font) vars.fontFamily = font;
		const read = (target: string, token: string) => {
			const value = cs.getPropertyValue(token).trim();
			if (!value) {
				// No fallback by design: a missing token is a bug in layout.css, not a style choice.
				if (import.meta.env.DEV)
					console.warn(`mermaid: ${token} is undefined (themeVariables.${target})`);
				return;
			}
			vars[target] = value;
		};
		for (const [target, token] of Object.entries(MERMAID_VARS)) read(target, token);
		for (const [family, base] of RAMP_FAMILIES)
			RAMP.forEach((token, i) => read(`${family}${i + base}`, token));
		return vars;
	}

	async function renderAll() {
		const my = ++seq;
		let mermaid: typeof import('mermaid').default;
		try {
			mermaid = (await import('mermaid')).default;
		} catch {
			// No loader is coming — the code is the truth again.
			if (!disposed) for (const it of items) restoreCode(it);
			return;
		}
		if (disposed || my !== seq) return;
		mermaid.initialize({
			startOnLoad: false,
			securityLevel: 'strict',
			theme: 'base', // the only customizable theme
			look: 'classic', // pins over v12's mixed per-type defaults (neo for 10 types, classic for the rest)
			themeVariables: themeVariables()
		});
		for (const it of items) {
			try {
				const { svg } = await mermaid.render(`fzr-mmd-${++ids}`, it.src);
				if (disposed || my !== seq) return;
				it.svg = svg;
				if (!it.rendered) {
					const span = document.createElement('span');
					span.className = 'diagram';
					span.innerHTML = svg;
					if (onZoom) {
						span.classList.add('cursor-zoom-in');
						span.addEventListener('click', () =>
							onZoom({
								src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(it.svg)}`,
								alt: 'Diagram'
							})
						);
					}
					it.host.replaceWith(span);
					it.host = span;
					it.rendered = true;
				} else {
					it.host.innerHTML = svg; // theme re-render paints in place
				}
			} catch {
				if (!it.rendered) restoreCode(it); // parse error → honest code fallback
				// later theme re-renders that fail keep the last good diagram
			}
		}
	}

	void renderAll();

	// Theme flip → re-render with the new palette (attribute watch, no store coupling).
	const observer = new MutationObserver(() => void renderAll());
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

	return {
		destroy() {
			disposed = true;
			observer.disconnect();
		}
	};
}

/**
 * Makes every `<img>` inside the container click-to-zoom: adds a zoom cursor
 * and forwards `{ src, alt }` to the callback (the parent renders an ImageLightbox).
 */
export function zoomableImages(
	node: HTMLElement,
	onOpen: (image: { src: string; alt: string }) => void
) {
	const cleanups = Array.from(node.querySelectorAll('img')).map((img) => {
		img.classList.add('cursor-zoom-in');
		const handler = () => onOpen({ src: img.currentSrc || img.src, alt: img.alt });
		img.addEventListener('click', handler);
		return () => img.removeEventListener('click', handler);
	});

	return {
		destroy() {
			for (const cleanup of cleanups) cleanup();
		}
	};
}

/**
 * Watches the article's h2/h3 headings and flags the matching TOC links
 * (`a[data-toc-link]`, rendered by ArticleTOC) with `data-active` while their
 * section is in the upper part of the viewport.
 */
export function tocSpy(node: HTMLElement) {
	const headings = [...node.querySelectorAll<HTMLElement>('h2[id], h3[id]')];
	const links = [...document.querySelectorAll<HTMLElement>('a[data-toc-link]')];
	if (!headings.length || !links.length) return;

	const visible = new Set<HTMLElement>();

	function highlight(active: HTMLElement | undefined) {
		for (const link of links) {
			if (active && link.dataset.tocLink === active.id) link.dataset.active = '';
			else delete link.dataset.active;
		}
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) visible.add(entry.target as HTMLElement);
				else visible.delete(entry.target as HTMLElement);
			}
			// Topmost heading still on screen is the section the reader is in.
			const active = [...visible].sort(
				(a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
			)[0];
			highlight(active);
		},
		{ rootMargin: '0px 0px -60% 0px' }
	);
	for (const heading of headings) observer.observe(heading);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
