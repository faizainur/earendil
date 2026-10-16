import { PUBLIC_API_BASE } from '$app/env/public';
import { createApi } from './client';

export const api = createApi(PUBLIC_API_BASE);

export type { BlogApi } from './client';
export { ApiError } from './client';
export type { PostSummary, PostDetail, PostListResponse, SuggestResponse } from './types';
