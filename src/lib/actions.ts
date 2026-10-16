/**
 * Client-side enhancement actions for rendered Markdown bodies (DESIGN.md §6.6):
 * copy + wrap-toggle buttons on `<pre>` blocks, lazy images, and scroll-synced TOC highlighting.
 */

const pill =
	'rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur transition-colors hover:text-foreground';

/**
 * Adds a small toolbar (Wrap | Copy) to every `<pre>`. The Copy button is only
 * mounted when the async clipboard is available; wrapping works regardless.
 */
export function codeBlockTools(node: HTMLElement) {
	const toolbars: HTMLDivElement[] = [];

	for (const pre of Array.from(node.querySelectorAll('pre'))) {
		const toolbar = document.createElement('div');
		toolbar.className = 'absolute top-2 right-2 flex gap-2';

		const wrap = document.createElement('button');
		wrap.type = 'button';
		wrap.textContent = 'Wrap';
		wrap.setAttribute('aria-pressed', 'false');
		wrap.setAttribute('aria-label', 'Toggle line wrapping for this code block');
		wrap.className = `${pill} text-muted-foreground`;
		wrap.addEventListener('click', () => {
			const on = pre.classList.toggle('code-wrap');
			wrap.setAttribute('aria-pressed', String(on));
			wrap.classList.toggle('text-foreground', on);
			wrap.classList.toggle('text-muted-foreground', !on);
		});
		toolbar.appendChild(wrap);

		if (navigator.clipboard) {
			const copy = document.createElement('button');
			copy.type = 'button';
			copy.textContent = 'Copy';
			copy.setAttribute('aria-label', 'Copy code to clipboard');
			copy.className = `${pill} text-muted-foreground`;
			copy.addEventListener('click', () => {
				navigator.clipboard.writeText(pre.textContent ?? '').then(
					() => {
						copy.textContent = 'Copied!';
						setTimeout(() => (copy.textContent = 'Copy'), 2000);
					},
					() => {
						/* clipboard rejected (e.g. insecure context) — leave the button idle */
					}
				);
			});
			toolbar.appendChild(copy);
		}

		pre.classList.add('relative');
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
