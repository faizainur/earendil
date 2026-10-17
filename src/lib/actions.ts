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
 * the block is hovered or keyboard-focused. Touch devices have no hover: there a
 * tap on the block toggles the toolbar (a tap away retracts it — see
 * .code-tools-open). The Copy button is only mounted when the async clipboard is
 * available; wrapping works regardless.
 */
export function codeBlockTools(node: HTMLElement) {
	const blocks: { pre: HTMLPreElement; toolbar: HTMLDivElement; wrapper: HTMLDivElement }[] = [];

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

		// Anchor the bar to a wrapper, NOT the pre: an absolutely-positioned child of
		// a horizontal scroll container is laid out against the unscrolled box and
		// scrolls away with the content — so `right-2` would drift off-screen while
		// the reader swipes through a long line. The wrapper never scrolls.
		const wrapper = document.createElement('div');
		wrapper.className = 'relative group';
		pre.parentNode?.insertBefore(wrapper, pre);
		wrapper.appendChild(pre);
		wrapper.appendChild(toolbar);
		blocks.push({ pre, toolbar, wrapper });
	}

	// Touch devices have no hover to reveal the toolbar with, and an always-visible
	// one would sit on top of the code: tap a block to toggle its tools (one bar at
	// a time), tap anywhere else to retract. Hover-capable devices keep the
	// CSS-only group-hover behavior — nothing is registered for them.
	const touch = window.matchMedia?.('(hover: none)').matches ?? false;
	let retract: ((e: Event) => void) | null = null;
	if (touch) {
		for (const { pre, toolbar } of blocks) {
			pre.addEventListener('click', (e) => {
				// A tap on the tools themselves performs its action and keeps the bar open.
				if ((e.target as HTMLElement).closest('.code-tools')) return;
				const opening = !toolbar.classList.contains('code-tools-open');
				for (const b of blocks) b.toolbar.classList.remove('code-tools-open');
				if (opening) toolbar.classList.add('code-tools-open');
			});
		}
		retract = (e) => {
			if ((e.target as HTMLElement | null)?.closest('pre, .code-tools')) return; // in-block taps handled above
			for (const b of blocks) b.toolbar.classList.remove('code-tools-open');
		};
		document.addEventListener('click', retract);
	}

	for (const img of node.querySelectorAll('img')) {
		if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
	}

	return {
		destroy() {
			if (retract) document.removeEventListener('click', retract);
			// Reopen the fence: move the pre back out, dropping the wrapper (and its
			// toolbar child) — listeners bound to the pre survive the reparent.
			for (const { pre, wrapper } of blocks) {
				wrapper.parentNode?.insertBefore(pre, wrapper);
				wrapper.remove();
			}
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

/**
 * Pinch-to-zoom + drag-to-pan for a standalone image (the lightbox `<img>`).
 * Pointer events cover every modality: two-finger pinch scales around the
 * pinch midpoint (and drags while pinching), one-finger drag pans while
 * zoomed, trackpad/mouse ctrl+wheel zooms around the cursor, double-click
 * resets. Motion lives on the img's own transform, so the figure's enter/exit
 * transitions and the backdrop's tap-away (direct-target-only) are untouched.
 */
export function pinchZoom(
	node: HTMLElement,
	opts?: { onZoomChange?: (zoomedIn: boolean) => void }
) {
	node.style.touchAction = 'none'; // the element owns the gesture; browser page-zoom would fight it
	node.style.userSelect = 'none';
	node.setAttribute('draggable', 'false');

	const MIN = 1;
	const MAX = 5;

	let scale = 1;
	let tx = 0;
	let ty = 0;
	// Layout box of the element, captured while untransformed (scale === 1).
	let base = { cx: 0, cy: 0, w: 0, h: 0 };
	const pointers = new Map<number, { x: number; y: number }>();
	// Pinch anchors the image-local point under the start midpoint: ux/uy stay
	// glued to the (moving) midpoint as the scale changes.
	let pinch: { d0: number; s0: number; ux: number; uy: number } | null = null;
	let panFrom: { x: number; y: number; tx: number; ty: number } | null = null;
	let wasZoomed = false; // last zoom state reported to the host

	const mid = () => {
		const [a, b] = [...pointers.values()];
		return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
	};
	const spread = () => {
		const [a, b] = [...pointers.values()];
		return Math.hypot(b.x - a.x, b.y - a.y);
	};

	function apply(animate = false) {
		node.style.transition = animate ? 'transform 180ms ease-out' : 'none';
		node.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
		// Painted beyond the layout box while zoomed — let the host react (e.g. fade
		// the caption, which would otherwise sit underneath the enlarged image).
		const zoomedIn = scale > 1;
		if (zoomedIn !== wasZoomed) {
			wasZoomed = zoomedIn;
			opts?.onZoomChange?.(zoomedIn);
		}
		if (animate) {
			const done = () => (node.style.transition = 'none');
			node.addEventListener('transitionend', done, { once: true });
			setTimeout(done, 220); // belt: transitionend can be missed if nothing visually changed
		}
	}

	/** Never let the image drift fully off-screen; center an axis when the
	 *  scaled size is smaller than the viewport. */
	function clampT() {
		const lx = Math.max(0, (base.w * scale - window.innerWidth) / 2);
		const ly = Math.max(0, (base.h * scale - window.innerHeight) / 2);
		tx = Math.min(lx, Math.max(-lx, tx));
		ty = Math.min(ly, Math.max(-ly, ty));
	}

	const refreshBase = () => {
		if (scale !== 1) return; // rect is layout truth only while untransformed
		const r = node.getBoundingClientRect();
		base = { cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width, h: r.height };
	};

	/** Scale toward/away from a fixed screen point (pinch midpoint or cursor). */
	const scaleAround = (px: number, py: number, target: number) => {
		const ux = (px - base.cx - tx) / scale;
		const uy = (py - base.cy - ty) / scale;
		scale = Math.min(MAX, Math.max(MIN, target));
		tx = px - base.cx - scale * ux;
		ty = py - base.cy - scale * uy;
	};

	const onDown = (e: PointerEvent) => {
		e.preventDefault(); // no native drag/selection competing with the gesture (click still reaches the backdrop, which ignores non-direct targets anyway)
		node.setPointerCapture(e.pointerId);
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		refreshBase();
		if (pointers.size === 2) {
			pinch = { d0: spread(), s0: scale, ux: 0, uy: 0 };
			const m = mid();
			pinch.ux = (m.x - base.cx - tx) / scale;
			pinch.uy = (m.y - base.cy - ty) / scale;
			panFrom = null;
		} else if (pointers.size === 1 && scale > 1) {
			panFrom = { x: e.clientX, y: e.clientY, tx, ty };
		}
	};

	const onMove = (e: PointerEvent) => {
		if (!pointers.has(e.pointerId)) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (pinch && pointers.size >= 2) {
			// Allow overshoot below 1 for the spring-back feel; upper clamp is hard.
			const raw = pinch.s0 * (spread() / pinch.d0);
			const s2 = Math.min(MAX, Math.max(MIN * 0.5, raw));
			// Rubber-band under 1 instead of freezing the fingers.
			scale = s2 < MIN ? MIN + (s2 - MIN) * 0.35 : s2;
			const m = mid();
			tx = m.x - base.cx - scale * pinch.ux;
			ty = m.y - base.cy - scale * pinch.uy;
			apply();
		} else if (panFrom && pointers.size === 1) {
			tx = panFrom.tx + (e.clientX - panFrom.x);
			ty = panFrom.ty + (e.clientY - panFrom.y);
			apply();
		}
	};

	const onUp = (e: PointerEvent) => {
		pointers.delete(e.pointerId);
		if (pointers.size < 2) pinch = null;
		if (pointers.size === 1) {
			const [p] = pointers.values();
			panFrom = scale > MIN ? { x: p.x, y: p.y, tx, ty } : null;
		} else if (pointers.size === 0) {
			panFrom = null;
			scale = Math.max(MIN, scale); // spring over-pinch back to fit
			if (scale === 1) {
				tx = 0;
				ty = 0;
			} else {
				clampT();
			}
			// apply() may no-op (transform already identity) — notify unconditionally.
			if (scale > 1 !== wasZoomed) {
				wasZoomed = scale > 1;
				opts?.onZoomChange?.(wasZoomed);
			}
			apply(true);
		}
	};

	const onDbl = () => {
		if (scale > 1) {
			scale = 1;
			tx = ty = 0;
			apply(true);
		}
	};

	const onWheel = (e: WheelEvent) => {
		if (!e.ctrlKey) return; // trackpad pinch sends ctrl+wheel; plain scroll stays un hijacked
		e.preventDefault();
		refreshBase();
		scaleAround(e.clientX, e.clientY, scale * Math.exp(-e.deltaY * 0.01));
		if (scale === 1) {
			tx = 0;
			ty = 0;
		}
		clampT();
		apply();
	};

	node.addEventListener('pointerdown', onDown);
	node.addEventListener('pointermove', onMove);
	node.addEventListener('pointerup', onUp);
	node.addEventListener('pointercancel', onUp);
	node.addEventListener('lostpointercapture', onUp);
	node.addEventListener('dblclick', onDbl);
	node.addEventListener('wheel', onWheel, { passive: false });

	return {
		destroy() {
			node.removeEventListener('pointerdown', onDown);
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerup', onUp);
			node.removeEventListener('pointercancel', onUp);
			node.removeEventListener('lostpointercapture', onUp);
			node.removeEventListener('dblclick', onDbl);
			node.removeEventListener('wheel', onWheel);
		}
	};
}

/** mermaid themeVariable → CSS token. layout.css is the ONLY source of color —
 * change diagram colors there, never here.
 *
 * Deliberately NEUTRALS ONLY: entities/actors cycle the theme's own categorical
 * palette (redux-color's borderColorArray/bkgColorArray — the per-box variance
 * that makes the look). The theme's updateColors() keeps `x = x || <derived>`
 * guards, so these neutrals win; overriding the primary/secondary/tertiary
 * trio instead would flatten the variance, and vars the theme pins
 * unconditionally (mainBkg, notes) must stay its. Chart-type series families
 * (variable-driven, not array-cycled) come from RAMP below.
 * Hard constraint: mermaid reads hex only (#rgb/#rrggbb) — enforced by
 * theming.contract.test.ts, not by review. */
const MERMAID_VARS = {
	background: '--diagram-bg',
	primaryTextColor: '--diagram-ink',
	textColor: '--diagram-ink',
	lineColor: '--diagram-muted'
} as const;

/** Categorical ramp (chart-type series that are variable-driven rather than
 *  array-cycled) — layout.css owns the hues. Entity colors for the 10 redux
 *  types come from the THEME's own borderColorArray/bkgColorArray (the per-box
 *  variance) — deliberately NOT overridden: flattening them kills the look,
 *  and the dark counterpart intentionally ships an empty fill array for contrast.
 *  `base` is each family's starting index: mermaid's pie vars are 1-based, the rest 0-based.
 *  Families: pie (pie charts), git (gitGraph branches), fillType (user-journey steps),
 *  series (xyChart bars/lines), cScale (quadrantChart + radar point colors). */
const RAMP = ['--diagram-cat-1', '--diagram-cat-2', '--diagram-cat-3', '--diagram-cat-4'] as const;
const RAMP_FAMILIES: Array<[string, number]> = [
	['pie', 1],
	['git', 0],
	['fillType', 0],
	['series', 0],
	['cScale', 0]
];

/**
 * Zoom-snapshot sizing: mermaid sizes its output with `viewBox` + a `max-width`
 * style (and percentage dimensions), which only works while the SVG is inline
 * in the page. Serialized to a data-URL `<img>` there are no intrinsic
 * dimensions — browsers fall back to a tiny default box. Bake explicit px
 * width/height from the viewBox into a copy used for the snapshot.
 */
export function svgForZoom(svg: string): string {
	const vb = /viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/.exec(svg);
	if (!vb) return svg;
	const w = Math.ceil(Number(vb[1]));
	const h = Math.ceil(Number(vb[2]));
	return svg.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
		const cleaned = attrs
			.replace(/max-width:[^;"]*;?/g, '') // inline-only sizing, misleading inside <img>
			.replace(/\s(?:width|height)="[^"]*"/g, ''); // percentage / stale dims
		return `<svg${cleaned} width="${w}" height="${h}">`;
	});
}

/** The v12 categorical themes: entities cycle the theme's own 12-hue palette.
 *  Dark gets its named counterpart (its fill array is deliberately empty —
 *  saturated fills lose contrast behind light text). */
const isDarkMode = () => document.documentElement.dataset.theme === 'dark';

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
			darkMode: isDarkMode()
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
			// v12 categorical themes: entities/actors/subgraph branches cycle the
			// theme's own 12-hue palette (the per-box variance); neutrals come from
			// our tokens; dark swaps to the contrast-tuned counterpart.
			theme: isDarkMode() ? 'redux-dark-color' : 'redux-color',
			// look deliberately unset: the 10 categorical types pair with `neo`
			// geometry (rounded boxes, 2px colored borders), chart types keep
			// `classic` — matching the look of each family's own palette.
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
								src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgForZoom(it.svg))}`,
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
