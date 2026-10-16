<script lang="ts">
	import { copyButtons, tocSpy } from '#lib/actions.ts';
	import ArticleTOC from '#lib/components/ArticleTOC.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const dateFormatter = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: '2-digit',
		year: 'numeric'
	});
	let date = $derived(dateFormatter.format(new Date(data.post.date)));
</script>

<article class="grid grid-cols-12 gap-8">
	<aside class="col-span-9 grid grid-cols-12 gap-6">
		<div class="hidden pt-2 lg:col-span-2 lg:block">
			<div class="sticky top-6 text-xs text-muted-foreground">
				<div class="mb-6">
					<p class="mb-2">{date}</p>
					<p>{data.post.readTime} min read</p>
				</div>
				{#if data.post.tags.length > 0}
					<div class="grid gap-1 border-t border-border pt-4">
						{#each data.post.tags as tag (tag)}
							<p>{tag}</p>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="col-span-12 min-w-0 lg:col-span-10">
			<h1 class="mb-4 text-4xl font-semibold tracking-tight text-foreground">{data.post.title}</h1>
			<p class="mb-4 max-w-2xl text-xl leading-relaxed text-muted-foreground">
				{data.post.preview}
			</p>
			<nav
				aria-label="Breadcrumb"
				class="mb-4 flex items-center gap-2 text-xs text-muted-foreground"
			>
				<a href="/" class="transition-colors hover:text-foreground">Home</a>
				<span aria-hidden="true">/</span>
				<a href="/articles" class="transition-colors hover:text-foreground">Articles</a>
				<span aria-hidden="true">/</span>
				<span class="text-foreground">{data.post.title}</span>
			</nav>
			<div class="mb-4 flex items-center gap-2 text-sm text-muted-foreground lg:hidden">
				<span>{date}</span>
				<span aria-hidden="true">·</span>
				<span>{data.post.readTime} min read</span>
				{#if data.post.tags.length > 0}
					<span aria-hidden="true">·</span>
					<span>{data.post.tags.join(', ')}</span>
				{/if}
			</div>
			{#if data.toc.length > 0}
				<div class="mb-4 lg:hidden">
					<ArticleTOC toc={data.toc} />
				</div>
			{/if}

			<!-- Rendered Markdown (DESIGN.md §6.5); enhanced by the actions below. -->
			<div class="prose mt-10 max-w-none text-base leading-relaxed" use:copyButtons use:tocSpy>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML is DOMPurify-sanitized in the server Markdown pipeline -->
				{@html data.html}
			</div>
		</div>
	</aside>

	{#if data.toc.length > 0}
		<aside class="col-span-3 hidden lg:block">
			<div class="sticky top-6">
				<ArticleTOC toc={data.toc} variant="sticky" />
			</div>
		</aside>
	{/if}
</article>
