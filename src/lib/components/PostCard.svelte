<script lang="ts">
	import type { PostSummary } from '#lib/api/index.ts';

	interface Props {
		post: PostSummary;
	}

	let { post }: Props = $props();

	const dateFormatter = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: '2-digit',
		year: 'numeric'
	});
</script>

<a
	href="/posts/{post.slug}"
	class="group flex items-center gap-4 border-t border-border py-5 transition-colors hover:bg-accent/40 sm:gap-6 sm:py-6"
>
	<div class="flex min-w-0 flex-1 flex-col gap-1.5">
		<h2 class="text-lg font-medium tracking-tight text-foreground sm:text-xl">
			{post.title}
		</h2>
		<!-- BE owns the preview text; FE clamps it visually to 3 lines with an ellipsis. -->
		<p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.preview}</p>
		<p class="text-xs text-muted-foreground">
			{dateFormatter.format(new Date(post.date))} · {post.readTime} min read
		</p>
	</div>
	{#if post.thumbnail}
		<img
			src={post.thumbnail}
			alt=""
			loading="lazy"
			class="size-24 shrink-0 rounded-lg border border-border object-cover transition-transform group-hover:scale-[1.03] sm:size-32"
		/>
	{/if}
</a>
