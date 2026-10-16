export interface PostSummary {
	slug: string;
	title: string;
	preview: string;
	date: string;
	readTime: number;
	thumbnail: string;
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
