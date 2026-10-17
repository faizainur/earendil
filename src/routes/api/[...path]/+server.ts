// Same-origin proxy for the handful of browser-side API calls (search suggestions
// in SearchDialog). The backend has NO public ingress, so the browser can only
// reach it through this SSR pod: GET /api/... -> API_BASE/api/... on the internal
// network. Server-side load functions skip this hop and call API_BASE directly.
import { error } from '@sveltejs/kit';

export const GET = async ({ url, params }: { url: URL; params: { path?: string } }) => {
	const base = process.env.API_BASE;
	if (!base) error(503, 'backend not configured');

	const target = new URL(`/api/${params.path ?? ''}${url.search}`, base);
	const res = await fetch(target);

	return new Response(await res.arrayBuffer(), {
		status: res.status,
		headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' }
	});
};
