import { api } from '#lib/api/index.ts';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const [posts, photos, featured] = await Promise.all([
		api.getPosts(),
		api.getPhotos({ limit: 6 }),
		api.getFeaturedPhoto()
	]);
	return { posts: posts.items, photos: photos.items, featured };
}) satisfies PageServerLoad;
