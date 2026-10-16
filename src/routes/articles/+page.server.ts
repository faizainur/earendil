import { redirect } from '@sveltejs/kit';
import { api } from '#lib/api/index.ts';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load = (async ({ url }) => {
	const tag = url.searchParams.get('tag') || undefined;
	const requested = Number(url.searchParams.get('page')) || 1;
	const page = Math.max(1, requested);
	const offset = (page - 1) * PAGE_SIZE;

	const { total, items } = await api.getPosts({ offset, limit: PAGE_SIZE, tag });
	const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	if (page > pages) redirect(307, `/articles?page=${pages}${tag ? `&tag=${tag}` : ''}`);

	return { posts: items, page, pages, total, tag };
}) satisfies PageServerLoad;
