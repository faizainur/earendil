import { mockApi } from './mock';
import type {
	Photo,
	PhotoListResponse,
	PostDetail,
	PostListResponse,
	SuggestResponse
} from './types';

export interface BlogApi {
	getPosts(opts?: { offset?: number; limit?: number; tag?: string }): Promise<PostListResponse>;
	getPost(slug: string): Promise<PostDetail>;
	suggestPosts(q: string, limit?: number): Promise<SuggestResponse>;
	/** Ranked, paginated full-text search — the /search page (suggest is the palette's capped launcher). */
	searchPosts(q: string, opts?: { offset?: number; limit?: number }): Promise<PostListResponse>;
	getPhotos(opts?: { limit?: number }): Promise<PhotoListResponse>;
	/** The homepage hero photo — curation is the BE's call; null when unset. */
	getFeaturedPhoto(): Promise<Photo | null>;
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
			if (opts?.tag) params.set('tag', opts.tag);
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
		searchPosts(q, opts) {
			const params = new URLSearchParams({ q });
			if (opts?.offset !== undefined) params.set('offset', String(opts.offset));
			if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
			return get<PostListResponse>(`/api/search?${params}`);
		},
		getPhotos(opts) {
			const params = new URLSearchParams();
			if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
			const query = params.toString();
			return get<PhotoListResponse>(`/api/photos${query ? `?${query}` : ''}`);
		},
		async getFeaturedPhoto() {
			const res = await fetch(`${base}/api/photos/featured`);
			if (res.status === 404) return null;
			if (!res.ok)
				throw new ApiError(res.status, `GET /api/photos/featured failed with status ${res.status}`);
			return (await res.json()) as Photo;
		}
	};
}
