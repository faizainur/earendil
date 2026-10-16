import { fail } from '@sveltejs/kit';
import { api } from '#lib/api/index.ts';
import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
	const [posts, photos] = await Promise.all([api.getPosts(), api.getPhotos()]);
	return { posts: posts.items, photos: photos.items };
}) satisfies PageServerLoad;

export const actions = {
	contact: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const message = String(form.get('message') ?? '').trim();
		if (!name || !email || !message) {
			return fail(400, { error: 'All fields are required.', name, email, message });
		}
		try {
			await api.sendContact({ name, email, message });
		} catch {
			return fail(502, { error: 'Could not send the message, please try again.', name, email });
		}
		return { ok: true };
	}
} satisfies Actions;
