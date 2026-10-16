<script lang="ts">
	import ArticleCard from '#lib/components/ArticleCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const tagQs = $derived(data.tag ? `&tag=${encodeURIComponent(data.tag)}` : '');
</script>

<section class="flex flex-col gap-6">
	<div class="flex items-center justify-between border-t border-border pt-4">
		{#if data.tag}
			<p class="font-brand text-sm font-medium text-muted-foreground">
				Articles tagged <span class="text-foreground">{data.tag}</span><span class="text-brand"
					>;</span
				>
			</p>
			<a
				href="/articles"
				class="text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				Clear ×
			</a>
		{:else}
			<p class="font-brand text-sm font-medium text-muted-foreground">
				All articles<span class="text-brand">;</span>
			</p>
		{/if}
	</div>
	{#if data.posts.length === 0}
		<p class="text-sm text-muted-foreground">No articles here yet.</p>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.posts as post (post.slug)}
				<ArticleCard {post} />
			{/each}
		</div>
	{/if}

	{#if data.posts.length > 0}
		<nav
			class="flex items-center justify-between text-sm text-muted-foreground"
			aria-label="Pagination"
		>
			{#if data.page > 1}
				<a
					href="/articles?page={data.page - 1}{tagQs}"
					rel="prev"
					class="font-medium text-primary transition-colors hover:text-foreground"
				>
					← Newer
				</a>
			{:else}
				<span aria-hidden="true" class="opacity-40">← Newer</span>
			{/if}

			<p>Page {data.page} of {data.pages}</p>

			{#if data.page < data.pages}
				<a
					href="/articles?page={data.page + 1}{tagQs}"
					rel="next"
					class="font-medium text-primary transition-colors hover:text-foreground"
				>
					Older →
				</a>
			{:else}
				<span aria-hidden="true" class="opacity-40">Older →</span>
			{/if}
		</nav>
	{/if}
</section>
