// Server-only API instance. In the cluster this targets the backend's internal
// service DNS (API_BASE) — the API has no public ingress. Falls back to
// PUBLIC_API_BASE for local dev (e.g. a port-forwarded base), and to mock
// fixtures when neither is set. Only import from +page.server.ts / +server.ts /
// other server-only modules — $app/env/private is not importable from client code.
import { PUBLIC_API_BASE } from '$app/env/public';
import { createApi } from './client';

export const api = createApi(process.env.API_BASE || PUBLIC_API_BASE || undefined);

export { ApiError } from './client';
