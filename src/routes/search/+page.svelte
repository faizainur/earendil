<script lang="ts">
	import { Search } from 'lucide-svelte';
	import PostCard from '#lib/components/PostCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const filterQs = () =>
		data.q ? `q=${encodeURIComponent(data.q)}` : `tag=${encodeURIComponent(data.tag as string)}`;
</script>

<svelte:head>
	{#if data.q}
		<!-- Query pages are transient views over the corpus; tag pages may be indexed. -->
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<section class="fade-up mx-auto flex w-full max-w-3xl flex-col gap-6">
	<div class="flex items-center justify-between gap-4 border-t border-border pt-4">
		<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
			{#if data.q}
				Results for &ldquo;{data.q}&rdquo;
			{:else}
				Tagged &ldquo;{data.tag}&rdquo;
			{/if}
			· {data.total}
			{data.total === 1 ? 'post' : 'posts'}
		</p>
		<a
			href="/"
			class="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
		>
			Clear
		</a>
	</div>

	<form method="GET" action="/search" class="flex items-center gap-3">
		<label class="flex min-w-0 grow items-center gap-3 rounded-full border border-border px-4 py-2">
			<Search class="size-4 shrink-0 text-muted-foreground" />
			<!-- The tag filter is dropped on a new query — search is the intent switch. -->
			<input
				type="search"
				name="q"
				value={data.q ?? ''}
				placeholder="Search posts…"
				aria-label="Search posts"
				class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
			/>
		</label>
		<button
			type="submit"
			class="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			Search
		</button>
	</form>

	{#key `${data.page}:${data.q ?? ''}:${data.tag ?? ''}`}
		<div class="fade-in flex flex-col gap-6">
			<div>
				{#each data.posts as post (post.slug)}
					<PostCard {post} />
				{/each}
				{#if data.posts.length === 0}
					<p class="border-t border-border py-6 text-sm text-muted-foreground">
						No posts matched{#if data.q}
							&ldquo;{data.q}&rdquo;{/if}.
					</p>
				{/if}
			</div>

			{#if data.posts.length > 0 && data.pages > 1}
				<nav
					class="flex items-center justify-between text-sm text-muted-foreground"
					aria-label="Pagination"
				>
					{#if data.page > 1}
						<a
							href="/search?page={data.page - 1}&{filterQs()}"
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
							href="/search?page={data.page + 1}&{filterQs()}"
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
		</div>
	{/key}
</section>
