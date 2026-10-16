<script lang="ts">
	import type { PostSummary } from '#lib/api/index.ts';

	interface Props {
		post: PostSummary;
		/** 1-based curation position — rendered as a violet `01;` index. */
		index?: number;
	}

	let { post, index }: Props = $props();

	const dateFormatter = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: '2-digit',
		year: 'numeric'
	});
</script>

<a
	href="/posts/{post.slug}"
	class="group flex items-center gap-4 border-t border-border px-5 py-5 transition-colors hover:bg-accent/40 sm:gap-6 sm:px-6 sm:py-6"
>
	<div class="flex min-w-0 flex-1 flex-col gap-1.5">
		<!-- Meta first, like a masthead: mono is the developer voice. -->
		<p class="font-mono text-xs text-muted-foreground">
			{#if index !== undefined}
				<span class="text-brand">{String(index).padStart(2, '0')};</span>
			{/if}
			{dateFormatter.format(new Date(post.date))} · {post.readTime} min read
		</p>
		<h2 class="font-brand text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
			<span
				class="relative inline after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-brand after:transition-[width] after:duration-200 group-hover:after:w-full"
			>
				{post.title}
			</span>
		</h2>
		{#if post.subtitle}
			<p class="text-sm leading-snug text-foreground/70">{post.subtitle}</p>
		{/if}
		<!-- BE owns the preview text; FE clamps it visually to 3 lines with an ellipsis. -->
		<p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.preview}</p>
	</div>
	{#if post.thumbnail}
		<img
			src={post.thumbnail}
			alt=""
			loading="lazy"
			class="size-20 shrink-0 rounded-lg border border-border object-cover transition-transform group-hover:scale-[1.03] sm:size-28"
		/>
	{/if}
</a>
