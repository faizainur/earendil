import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_API_BASE: {
		public: true,
		// accepts unset so the app falls back to the mock layer until the BE is live
		schema: (value) => value,
		description: 'Base URL of the backend REST API. When unset, the mock fixtures are used.'
	}
});
