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
	class="group flex flex-col overflow-hidden rounded-xl border border-border transition-colors hover:bg-accent/40"
>
	{#if post.thumbnail}
		<img src={post.thumbnail} alt="" loading="lazy" class="aspect-video w-full object-cover" />
	{/if}
	<div class="flex flex-1 flex-col gap-2 p-5">
		<h2
			class="text-lg leading-snug font-medium tracking-tight text-foreground group-hover:underline"
		>
			{post.title}
		</h2>
		<p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.preview}</p>
		<p class="mt-auto pt-3 text-xs text-muted-foreground">
			{dateFormatter.format(new Date(post.date))} · {post.readTime} min read
		</p>
	</div>
</a>
