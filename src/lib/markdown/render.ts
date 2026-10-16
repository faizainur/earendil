/**
 * Server-side Markdown pipeline (DESIGN.md §6): markdown-it + anchors + task
 * lists → Shiki dual-theme highlighting → TOC extraction → DOMPurify sanitize.
 * Imported only from `+page.server.ts` code — never bundle this on the client.
 */
import MarkdownIt, { type MarkdownIt as MarkdownItInstance, type Token } from 'markdown-it';
import anchor from 'markdown-it-anchor';
import container from 'markdown-it-container';
import taskLists from 'markdown-it-task-lists';
import markdownItShiki from '@shikijs/markdown-it';
import type { BuiltinLanguage } from 'shiki';
import DOMPurify from 'isomorphic-dompurify';

export interface TocEntry {
	id: string;
	text: string;
	depth: 2 | 3;
}

/** Confirmed language set — DESIGN.md §6. K8s manifests use `yaml`, Terraform `hcl`. */
const SHIKI_LANGS: BuiltinLanguage[] = [
	'go',
	'rust',
	'clojure',
	'javascript',
	'typescript',
	'python',
	'bash',
	'yaml',
	'json',
	'dockerfile',
	'hcl'
];

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
// `permalink` defaults to false in markdown-it-anchor v10 — heading ids only, no anchor icons.
md.use(anchor, { level: [2, 3] });
md.use(taskLists);
/**
 * Authoring directive `::: grid ... :::` — a masonry image grid inside articles,
 * styled to match /gallery. Unknown `:::name` blocks are left to render as plain
 * text, so old content degrades gracefully.
 */
md.use(container, 'grid', {
	render: (tokens, idx) =>
		tokens[idx].nesting === 1 ? '<div class="article-grid columns-2 md:columns-3">\n' : '</div>\n'
});

/** Lazily build the Shiki-ready engine once per process (grammar loading is the slow part). */
let engine: Promise<MarkdownItInstance> | null = null;
function markdownEngine(): Promise<MarkdownItInstance> {
	if (!engine) {
		engine = markdownItShiki({
			themes: { light: 'github-light', dark: 'github-dark' },
			defaultColor: false, // emit --shiki-light/--shiki-dark CSS vars (mapped in layout.css)
			langs: SHIKI_LANGS,
			// `text` is Shiki's special plain-text language; option types lag behind the runtime.
			fallbackLanguage: 'text' as BuiltinLanguage
		}).then((shiki) => {
			md.use(shiki);
			return md;
		});
	}
	return engine;
}

export async function renderMarkdown(markdown: string): Promise<{ html: string; toc: TocEntry[] }> {
	const instance = await markdownEngine();
	const env = {};
	const tokens = instance.parse(markdown, env);
	const toc = extractToc(tokens);
	const html = instance.renderer.render(tokens, instance.options, env);
	return { html: DOMPurify.sanitize(html), toc };
}

/**
 * Anchor slugs are set by a markdown-it-anchor core rule, so heading_open
 * tokens already carry their `id` right after `parse()`.
 */
function extractToc(tokens: Token[]): TocEntry[] {
	const toc: TocEntry[] = [];
	for (const [index, token] of tokens.entries()) {
		if (token.type !== 'heading_open') continue;
		const depth = token.tag === 'h2' ? 2 : token.tag === 'h3' ? 3 : null;
		const id = token.attrGet('id');
		if (!depth || typeof id !== 'string' || id === '') continue;
		const inline = tokens[index + 1];
		const text =
			inline?.type === 'inline'
				? (inline.children ?? [])
						.filter((child) => child.type === 'text' || child.type === 'code_inline')
						.map((child) => child.content)
						.join('')
				: '';
		toc.push({ id, text, depth });
	}
	return toc;
}
