import { redirect } from '@sveltejs/kit';
import { api } from '#lib/api/server.ts';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load = (async ({ url }) => {
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const [feed, featured] = await Promise.all([
		api.getPosts({ offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }),
		api.getFeaturedPhoto()
	]);
	const pages = Math.max(1, Math.ceil(feed.total / PAGE_SIZE));
	if (page > pages) redirect(307, `/?page=${pages}`);

	return { posts: feed.items, page, pages, total: feed.total, featured };
}) satisfies PageServerLoad;
