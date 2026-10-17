import { api } from '#lib/api/server.ts';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const { items } = await api.getPhotos();
	return { photos: items };
}) satisfies PageServerLoad;
