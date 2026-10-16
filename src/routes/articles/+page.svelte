<script lang="ts">
	import PostCard from '#lib/components/PostCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<section class="flex flex-col gap-6">
	<div class="border-t border-border pt-4">
		<p class="text-sm font-medium text-muted-foreground">All articles</p>
	</div>
	<div>
		{#each data.posts as post (post.slug)}
			<PostCard {post} />
		{/each}
	</div>

	<nav
		class="flex items-center justify-between text-sm text-muted-foreground"
		aria-label="Pagination"
	>
		{#if data.page > 1}
			<a
				href="/articles?page={data.page - 1}"
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
				href="/articles?page={data.page + 1}"
				rel="next"
				class="font-medium text-primary transition-colors hover:text-foreground"
			>
				Older →
			</a>
		{:else}
			<span aria-hidden="true" class="opacity-40">Older →</span>
		{/if}
	</nav>
</section>
