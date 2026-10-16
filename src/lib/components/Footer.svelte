<script lang="ts">
	const links = [
		{ label: 'GitHub', href: 'https://github.com' },
		{ label: 'LinkedIn', href: 'https://www.linkedin.com' },
		{ label: 'RSS', href: '/feed.xml' }
	];
</script>

<footer class="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
	<p class="text-sm text-muted-foreground">&copy; 2024 Felix</p>
	<div class="flex items-center gap-4 text-sm text-muted-foreground">
		{#each links as link (link.label)}
			<a href={link.href} class="transition-colors hover:text-foreground">{link.label}</a>
		{/each}
	</div>
</footer>
