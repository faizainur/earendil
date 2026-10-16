<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import { Search } from 'lucide-svelte';

	interface Props {
		theme: 'light' | 'dark';
		onToggle: () => void;
	}

	let { theme, onToggle }: Props = $props();

	const links = [
		{ label: 'Writing', href: '/', active: true },
		{ label: 'About', href: '#about', active: false },
		{ label: 'Now', href: '#now', active: false }
	];
</script>

<header class="border-b border-border">
	<div class="mx-auto flex w-full max-w-page items-center justify-between px-5 py-4">
		<div class="flex items-center gap-4 md:gap-8">
			<a href="/" class="text-sm font-semibold tracking-tight">F&#x2022;&#x2022;&#x2022;</a>
			<nav class="flex items-center gap-1 md:gap-6" aria-label="Main navigation">
				{#each links as link (link.label)}
					<a
						href={link.href}
						class="rounded px-3 py-2 text-sm transition-colors md:px-0
							{link.active ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>
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
		</div>
	</div>
</header>
