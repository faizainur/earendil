export interface PostSummary {
	slug: string;
	title: string;
	/** BE-owned display text (may be the article's opening); the FE only clamps it visually. */
	preview: string;
	date: string;
	readTime: number;
	/** Null when the post has no thumbnail — listings render title + preview only. */
	thumbnail: string | null;
}

export interface Photo {
	src: string;
	alt: string;
	/** Natural dimensions so the masonry grid can reserve layout. */
	width: number;
	height: number;
}

export interface PhotoListResponse {
	total: number;
	items: Photo[];
}

export interface PostDetail extends PostSummary {
	tags: string[];
	content: string;
}

export interface PostListResponse {
	total: number;
	items: PostSummary[];
}

export interface SuggestResponse {
	results: PostSummary[];
}
