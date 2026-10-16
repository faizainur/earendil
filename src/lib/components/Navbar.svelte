<script lang="ts">
	import { page } from '$app/state';
	import { Menu, Search, X } from 'lucide-svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	interface Props {
		theme: 'light' | 'dark';
		onToggle: () => void;
	}

	let { theme, onToggle }: Props = $props();

	const links = [
		{ label: 'Home', href: '/' },
		{ label: 'Articles', href: '/articles' },
		{ label: 'Gallery', href: '/gallery' },
		{ label: 'About', href: '/about' }
	];

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);

	let open = $state(false);

	// Close on navigation.
	$effect(() => {
		void page.url.pathname;
		open = false;
	});

	// Esc closes the menu while it is open.
	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') open = false;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<header class="relative border-b border-border">
	<div class="mx-auto flex w-full max-w-page items-center justify-between px-5 py-4">
		<a
			href="/"
			class="font-brand text-3xl leading-none font-semibold tracking-tight"
			style="font-variation-settings: 'SOFT' 40, 'WONK' 1"
			aria-label="fzr; — home"
		>
			fzr<span class="pl-1 text-brand">;</span></a
		>
		<div class="flex items-center gap-2 md:gap-8">
			<!-- Desktop: inline links -->
			<nav class="hidden items-center gap-6 md:flex" aria-label="Main navigation">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="text-sm transition-colors {isActive(link.href)
							? 'font-medium text-foreground'
							: 'text-muted-foreground hover:text-foreground'}"
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
			</nav>
			<div class="flex items-center gap-2">
				<!-- Desktop: bordered pill with label + shortcut hint -->
				<button
					type="button"
					class="hidden items-center gap-3 rounded-full border border-border px-3 py-2 text-sm
						text-muted-foreground transition-colors hover:bg-muted md:flex"
					aria-label="Search"
				>
					<Search class="size-4" />
					<span>Search</span>
					<span class="font-mono text-xs">Mod+K</span>
				</button>
				<!-- Mobile: compact icon-only button -->
				<button
					type="button"
					class="flex size-8 items-center justify-center rounded-md border border-border
						text-muted-foreground transition-colors hover:bg-muted md:hidden"
					aria-label="Search"
				>
					<Search class="size-4" />
				</button>
				<ThemeToggle {theme} {onToggle} />
				<!-- Mobile: hamburger -->
				<button
					type="button"
					class="flex size-8 items-center justify-center rounded-md border border-border
						text-muted-foreground transition-colors hover:bg-muted md:hidden"
					aria-label="Open menu"
					aria-expanded={open}
					aria-controls="mobile-nav"
					onclick={() => (open = !open)}
				>
					{#if open}
						<X class="size-4" />
					{:else}
						<Menu class="size-4" />
					{/if}
				</button>
			</div>
		</div>
	</div>

	{#if open}
		<!-- Tap-away layer under the panel -->
		<div
			class="fixed inset-0 z-10 md:hidden"
			aria-hidden="true"
			onclick={() => (open = false)}
		></div>
		<nav
			id="mobile-nav"
			aria-label="Main navigation"
			class="absolute inset-x-0 top-full z-20 flex flex-col border-b border-border bg-background p-5 shadow-lg md:hidden"
		>
			{#each links as link (link.href)}
				<a
					href={link.href}
					onclick={() => (open = false)}
					class="rounded px-3 py-3 text-sm transition-colors {isActive(link.href)
						? 'font-medium text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</nav>
	{/if}
</header>
