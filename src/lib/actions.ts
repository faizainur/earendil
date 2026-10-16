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
			'heading-anchor absolute -left-5 top-0 flex size-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity duration-100 ease-out hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100';
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
