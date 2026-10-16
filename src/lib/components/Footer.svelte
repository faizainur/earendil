<script lang="ts">
	const links = [
		{ label: 'GitHub', href: 'https://github.com' },
		{ label: 'LinkedIn', href: 'https://www.linkedin.com' },
		{ label: 'Instagram', href: 'https://www.linkedin.com' }
	];
</script>

<footer class="flex flex-col gap-3 border-t border-border pt-6">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<p class="text-sm text-muted-foreground">&copy; 2026 Faiz Ainur Rofiq</p>
		<div class="flex items-center gap-4 text-sm text-muted-foreground">
			{#each links as link (link.label)}
				<a href={link.href} class="transition-colors hover:text-foreground">{link.label}</a>
			{/each}
		</div>
	</div>
	<p class="text-xs text-muted-foreground/70">
		Built with SvelteKit &middot; self-hosted &middot; no trackers<span class="text-brand">;</span>
	</p>
</footer>
