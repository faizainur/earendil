import { mockApi } from './mock';
import type { PhotoListResponse, PostDetail, PostListResponse, SuggestResponse } from './types';

export interface BlogApi {
	getPosts(opts?: { offset?: number; limit?: number }): Promise<PostListResponse>;
	getPost(slug: string): Promise<PostDetail>;
	suggestPosts(q: string, limit?: number): Promise<SuggestResponse>;
	getPhotos(opts?: { limit?: number }): Promise<PhotoListResponse>;
}

export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export function createApi(base?: string): BlogApi {
	if (!base) return mockApi;
	return createFetchApi(base.replace(/\/+$/, ''));
}

function createFetchApi(base: string): BlogApi {
	async function get<T>(path: string): Promise<T> {
		const res = await fetch(`${base}${path}`);
		if (!res.ok) throw new ApiError(res.status, `GET ${path} failed with status ${res.status}`);
		return res.json() as Promise<T>;
	}

	return {
		getPosts(opts) {
			const params = new URLSearchParams();
			if (opts?.offset !== undefined) params.set('offset', String(opts.offset));
			if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
			const query = params.toString();
			return get<PostListResponse>(`/api/posts${query ? `?${query}` : ''}`);
		},
		getPost(slug) {
			return get<PostDetail>(`/api/posts/${encodeURIComponent(slug)}`);
		},
		suggestPosts(q, limit) {
			const params = new URLSearchParams({ q });
			if (limit !== undefined) params.set('limit', String(limit));
			return get<SuggestResponse>(`/api/search/suggest?${params}`);
		},
		getPhotos(opts) {
			const params = new URLSearchParams();
			if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
			const query = params.toString();
			return get<PhotoListResponse>(`/api/photos${query ? `?${query}` : ''}`);
		}
	};
}
