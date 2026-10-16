import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { mockApi } from './mock';

describe('getPosts', () => {
	it('returns all posts with correct total', async () => {
		const { total, items } = await mockApi.getPosts();
		expect(total).toBe(5);
		expect(items).toHaveLength(5);
		expect(items.map((p) => p.slug)).toEqual([
			'observability-is-a-contract',
			'shape-of-a-useful-queue',
			'when-latency-becomes-a-product-decision',
			'designing-for-the-failure-you-can-see',
			'a-small-field-guide-to-idempotency'
		]);
	});

	it('honors offset and limit', async () => {
		const { total, items } = await mockApi.getPosts({ offset: 1, limit: 2 });
		expect(total).toBe(5);
		expect(items.map((p) => p.slug)).toEqual([
			'shape-of-a-useful-queue',
			'when-latency-becomes-a-product-decision'
		]);
	});

	it('summaries do not carry detail fields', async () => {
		const { items } = await mockApi.getPosts({ limit: 1 });
		expect(items[0]).not.toHaveProperty('content');
		expect(items[0]).not.toHaveProperty('tags');
	});

	it('filters by tag', async () => {
		const { total, items } = await mockApi.getPosts({ tag: 'queues' });
		expect(total).toBe(1);
		expect(items[0].slug).toBe('shape-of-a-useful-queue');
		const none = await mockApi.getPosts({ tag: 'nope' });
		expect(none.items).toEqual([]);
	});

	it('searches with ranking, totals, and pagination', async () => {
		const { total, items } = await mockApi.searchPosts('queue');
		expect(total).toBeGreaterThanOrEqual(1);
		expect(items[0].slug).toBe('shape-of-a-useful-queue');
		expect((await mockApi.searchPosts('zzzz-nothing')).items).toEqual([]);
		const paged = await mockApi.searchPosts('a', { offset: 1, limit: 1 });
		expect(paged.items).toHaveLength(1);
	});
});

describe('getPost', () => {
	it('returns the queue article with markdown sections and code fences', async () => {
		const post = await mockApi.getPost('shape-of-a-useful-queue');
		expect(post.title).toBe('The shape of a useful queue');
		expect(post.readTime).toBe(8);
		expect(post.tags.length).toBeGreaterThan(0);
		expect(post.content).toContain('## The queue is a promise');
		expect(post.content).toContain('> A queue buys time');
		expect(post.content).toContain('```go');
		expect(post.content).toContain('```bash');
		expect(post.content).toMatch(/\[.+\]\(.+\)/);
	});

	it('rejects an unknown slug with ApiError 404', async () => {
		await expect(mockApi.getPost('no-such-post')).rejects.toThrow(ApiError);
		await expect(mockApi.getPost('no-such-post')).rejects.toMatchObject({ status: 404 });
	});
});

describe('suggestPosts', () => {
	it('finds the queue post first for "queue"', async () => {
		const { results } = await mockApi.suggestPosts('queue');
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].slug).toBe('shape-of-a-useful-queue');
	});

	it('is case-insensitive over title and preview', async () => {
		const { results } = await mockApi.suggestPosts('BACKPRESSURE');
		expect(results.map((p) => p.slug)).toContain('shape-of-a-useful-queue');
	});

	it('returns empty results when nothing matches', async () => {
		const { results } = await mockApi.suggestPosts('zzz');
		expect(results).toEqual([]);
	});

	it('honors the limit', async () => {
		const { results } = await mockApi.suggestPosts('a', 2);
		expect(results.length).toBeLessThanOrEqual(2);
	});
});

describe('thumbnail handling', () => {
	it('posts may carry null thumbnails', async () => {
		const { items } = await mockApi.getPosts();
		const withThumb = items.filter((p) => p.thumbnail !== null);
		const withoutThumb = items.filter((p) => p.thumbnail === null);
		expect(withThumb.length).toBeGreaterThan(0);
		expect(withoutThumb.length).toBeGreaterThan(0);
	});
});

describe('getPhotos', () => {
	it('returns a non-empty list with consistent total', async () => {
		const { total, items } = await mockApi.getPhotos();
		expect(items.length).toBeGreaterThan(0);
		expect(total).toBe(items.length);
	});

	it('each photo has dimensions and varied aspect ratios', async () => {
		const { items } = await mockApi.getPhotos();
		expect(items.every((p) => p.width > 0 && p.height > 0)).toBe(true);
		const ratios = new Set(items.map((p) => (p.width / p.height).toFixed(2)));
		expect(ratios.size).toBeGreaterThan(3);
	});

	it('honors the limit while keeping the full total', async () => {
		const { total, items } = await mockApi.getPhotos({ limit: 6 });
		expect(items).toHaveLength(6);
		expect(total).toBeGreaterThan(6);
	});

	it('serves a featured photo with source and alt', async () => {
		const featured = await mockApi.getFeaturedPhoto();
		expect(featured).not.toBeNull();
		expect(featured?.src).toMatch(/^https:\/\//);
		expect(featured?.alt).not.toBe('');
	});
});
