import { redirect } from '@sveltejs/kit';
import { api } from '#lib/api/server.ts';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load = (async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim() || undefined;
	const tag = (url.searchParams.get('tag') ?? '').trim() || undefined;
	if (!q && !tag) redirect(307, '/');

	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const filter = q ? `q=${encodeURIComponent(q)}` : `tag=${encodeURIComponent(tag as string)}`;
	const feed = q
		? await api.searchPosts(q, { offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
		: await api.getPosts({ offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE, tag });

	const pages = Math.max(1, Math.ceil(feed.total / PAGE_SIZE));
	if (page > pages) redirect(307, `/search?page=${pages}&${filter}`);

	return { posts: feed.items, page, pages, total: feed.total, q, tag };
}) satisfies PageServerLoad;
