import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		// Tunnel testing (ngrok hands out a fresh random hostname per session, so
		// match by suffix — a leading dot means "this domain and all subdomains",
		// stable even when the URL regenerates). Extra hosts: ALLOWED_HOSTS=h1,h2.
		allowedHosts: [
			'.ngrok-free.app',
			'.ngrok.app',
			...(process.env.ALLOWED_HOSTS?.split(',')
				.map((h) => h.trim())
				.filter(Boolean) ?? [])
		]
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-node builds a self-contained Node server (build/) for the K8s SSR
			// deployment — see Dockerfile and k8s-platform-manifests/applications/blog-frontend/.
			adapter: adapter({ out: 'build' })
		})
	]
});
