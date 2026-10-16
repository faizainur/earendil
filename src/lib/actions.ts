/**
 * Client-side enhancement actions for rendered Markdown bodies (DESIGN.md §6.6):
 * copy buttons on `<pre>` blocks, lazy images, and scroll-synced TOC highlighting.
 */

/** Adds a "Copy" pill to every `<pre>`; no-ops when the async clipboard is unavailable. */
export function copyButtons(node: HTMLElement) {
	if (!navigator.clipboard) return;

	const buttons: HTMLButtonElement[] = [];
	for (const pre of node.querySelectorAll('pre')) {
		const button = document.createElement('button');
		button.type = 'button';
		button.textContent = 'Copy';
		button.setAttribute('aria-label', 'Copy code to clipboard');
		button.className =
			'absolute top-2 right-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground';
		button.addEventListener('click', () => {
			navigator.clipboard.writeText(pre.textContent ?? '').then(
				() => {
					button.textContent = 'Copied!';
					setTimeout(() => (button.textContent = 'Copy'), 2000);
				},
				() => {
					/* clipboard rejected (e.g. insecure context) — leave the button idle */
				}
			);
		});
		pre.classList.add('relative');
		pre.appendChild(button);
		buttons.push(button);
	}

	for (const img of node.querySelectorAll('img')) {
		if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
	}

	return {
		destroy() {
			for (const button of buttons) button.remove();
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
