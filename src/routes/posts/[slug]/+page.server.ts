import { error } from '@sveltejs/kit';
import { ApiError, api } from '#lib/api/index.ts';
import { renderMarkdown } from '#lib/markdown/render.ts';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	let post;
	try {
		post = await api.getPost(params.slug);
	} catch (e) {
		if (e instanceof ApiError && e.status === 404) error(404, 'Post not found');
		throw e;
	}

	// The raw Markdown stays server-side; only the rendered HTML travels to the client.
	const { content: markdown, ...summary } = post;
	const { html, toc } = await renderMarkdown(markdown);
	return { post: summary, html, toc };
}) satisfies PageServerLoad;
