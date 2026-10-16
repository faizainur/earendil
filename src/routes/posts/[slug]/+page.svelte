<script lang="ts">
	import { codeBlockTools, headingAnchors, tocSpy, zoomableImages } from '#lib/actions.ts';
	import ArticleTOC from '#lib/components/ArticleTOC.svelte';
	import ImageLightbox from '#lib/components/ImageLightbox.svelte';
	import type { LightboxImage } from '#lib/components/ImageLightbox.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let zoomed = $state<LightboxImage | null>(null);

	const dateFormatter = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: '2-digit',
		year: 'numeric'
	});
	let date = $derived(dateFormatter.format(new Date(data.post.date)));

	// Chip pills are clickable tag filters: soften->deepen fill, foreground text, slight lift.
	const chip =
		'rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-foreground/10 hover:text-foreground hover:-translate-y-0.5';
</script>

<article class="fade-up grid grid-cols-12 gap-8">
	<aside class="col-span-12 grid grid-cols-12 gap-6 lg:col-span-9">
		<div class="hidden pt-2 lg:col-span-2 lg:block">
			<div class="sticky top-6 text-xs text-muted-foreground">
				<p class="mb-6 font-mono text-xs text-muted-foreground">
					{date} · {data.post.readTime} min read<span class="text-brand">;</span>
				</p>
				{#if data.post.tags.length > 0}
					<div class="flex flex-wrap gap-1.5 border-t border-border pt-4">
						{#each data.post.tags as tag (tag)}
							<a href="/search?tag={encodeURIComponent(tag)}" class={chip}>{tag}</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="col-span-12 min-w-0 lg:col-span-10">
			<h1 class="mb-4 font-brand text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
				{data.post.title}
			</h1>
			<p class="mb-4 max-w-2xl text-xl leading-relaxed text-muted-foreground">
				{data.post.preview}
			</p>
			<nav
				aria-label="Breadcrumb"
				class="mb-4 flex items-center gap-2 text-xs text-muted-foreground"
			>
				<a href="/" class="transition-colors hover:text-foreground">Home</a>
				<span aria-hidden="true">/</span>
				<a href="/#writing" class="transition-colors hover:text-foreground">Writing</a>
				<span aria-hidden="true">/</span>
				<span class="text-foreground">{data.post.title}</span>
			</nav>
			{#if data.post.thumbnail}
				<img
					src={data.post.thumbnail}
					alt={data.post.title}
					class="mt-2 mb-6 max-h-[60vh] w-full rounded-lg border border-border object-contain"
				/>
			{/if}
			<div
				class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-xs text-muted-foreground lg:hidden"
			>
				<span>{date}</span>
				<span aria-hidden="true">·</span>
				<span>{data.post.readTime} min read<span class="text-brand">;</span></span>
				{#each data.post.tags as tag (tag)}
					<a href="/search?tag={encodeURIComponent(tag)}" class={chip}>{tag}</a>
				{/each}
			</div>
			{#if data.toc.length > 0}
				<div class="mb-4 lg:hidden">
					<ArticleTOC toc={data.toc} />
				</div>
			{/if}

			<!-- Rendered Markdown (DESIGN.md §6.5); enhanced by the actions below. -->
			<div
				class="prose mt-10 max-w-none text-base leading-relaxed"
				use:codeBlockTools
				use:tocSpy
				use:headingAnchors
				use:zoomableImages={(image) => (zoomed = image)}
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML is DOMPurify-sanitized in the server Markdown pipeline -->
				{@html data.html}
			</div>
		</div>
	</aside>

	{#if data.toc.length > 0}
		<aside class="fade-up col-span-3 hidden [animation-delay:120ms] lg:block">
			<div class="sticky top-6">
				<ArticleTOC toc={data.toc} variant="sticky" />
			</div>
		</aside>
	{/if}
</article>

{#if zoomed}
	<ImageLightbox image={zoomed} onclose={() => (zoomed = null)} />
{/if}
