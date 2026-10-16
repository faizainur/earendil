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
	<div class="flex flex-1 flex-col gap-1.5 p-5">
		<!-- Meta above the title, matching the home rows: mono masthead + violet ';'. -->
		<p class="font-mono text-xs text-muted-foreground">
			{dateFormatter.format(new Date(post.date))} · {post.readTime} min read<span class="text-brand"
				>;</span
			>
		</p>
		<h2 class="font-brand text-lg leading-snug font-semibold tracking-tight text-foreground">
			<span
				class="relative inline after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-brand after:transition-[width] after:duration-200 group-hover:after:w-full"
			>
				{post.title}
			</span>
		</h2>
		{#if post.subtitle}
			<p class="text-sm leading-snug text-foreground/70">{post.subtitle}</p>
		{/if}
		<p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.preview}</p>
	</div>
</a>
