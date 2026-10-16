<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import Navbar from '#lib/components/Navbar.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// Intentionally seed from the server-rendered cookie value; client toggles own the state afterwards.
	// svelte-ignore state_referenced_locally
	let theme = $state(data.theme);

	function toggleTheme() {
		const next = theme === 'dark' ? 'light' : 'dark';
		theme = next;
		document.documentElement.dataset.theme = next;
		document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Apply persisted theme before paint to avoid a flash of the wrong theme. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- data.theme is a server-validated 'light'|'dark' literal -->
	{@html `<script>document.documentElement.dataset.theme="${data.theme}"</script>`}
</svelte:head>

<div class="flex min-h-svh flex-col bg-background text-foreground">
	<Navbar {theme} onToggle={toggleTheme} />
	<div class="mx-auto flex w-full max-w-page grow flex-col gap-12 px-5 py-12 md:px-8">
		<main class="flex flex-1 flex-col gap-12">
			{@render children()}
		</main>
		<Footer />
	</div>
</div>
