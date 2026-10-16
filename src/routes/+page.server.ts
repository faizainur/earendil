import { api } from '#lib/api/index.ts';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const { items } = await api.getPosts();
	return { posts: items };
}) satisfies PageServerLoad;
