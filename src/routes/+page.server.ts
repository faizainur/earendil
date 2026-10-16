import { api } from '#lib/api/index.ts';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const [posts, photos] = await Promise.all([api.getPosts(), api.getPhotos({ limit: 6 })]);
	return { posts: posts.items, photos: photos.items };
}) satisfies PageServerLoad;
