import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_API_BASE: {
		public: true,
		// accepts unset so the app falls back to the mock layer until the BE is live
		schema: (value) => value,
		description:
			'Base URL of the backend REST API as seen by the BROWSER. In the cluster this is "/" — ' +
			'calls go same-origin and are proxied server-side (see routes/api/[...path]) because the ' +
			'API is not publicly exposed. Unset = mock fixtures. A full URL is only for direct-backend dev.'
	},
	API_BASE: {
		// server-only module ($app/env/private); read here for validation/docs, used via process.env
		schema: (value) => value,
		description:
			'Internal base URL of the backend REST API, SERVER-SIDE ONLY. ' +
			'In the cluster: http://blog-backend.blog-backend.svc.cluster.local. Unset = mock layer.'
	}
});
