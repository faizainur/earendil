<script lang="ts">
	import { ArrowRight, ArrowUpRight } from 'lucide-svelte';
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
	class="group flex items-center gap-4 border-t border-border py-4 transition-colors hover:bg-accent/40
		sm:grid sm:grid-cols-12 sm:gap-6 sm:py-6"
>
	<!-- Desktop: meta as the leading grid column -->
	<div class="col-span-2 hidden flex-col gap-1 text-sm text-muted-foreground sm:flex">
		<time datetime={post.date}>{dateFormatter.format(new Date(post.date))}</time>
		<span>{post.readTime} min read</span>
	</div>

	<div class="col-span-9 flex min-w-0 flex-1 flex-col gap-1 sm:gap-2">
		<h2 class="text-lg font-medium tracking-tight text-foreground">{post.title}</h2>
		<p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:line-clamp-none">
			{post.preview}
		</p>
		<!-- Mobile: meta as one inline line under the preview -->
		<p class="text-xs text-muted-foreground sm:hidden">
			{dateFormatter.format(new Date(post.date))} · {post.readTime} min read
		</p>
	</div>

	<div class="flex shrink-0 justify-end sm:col-span-1 sm:pt-1">
		<ArrowRight class="size-4 text-muted-foreground sm:hidden" />
		<ArrowUpRight
			class="hidden size-5 text-muted-foreground transition-transform group-hover:translate-x-1
				group-hover:-translate-y-1 sm:block"
		/>
	</div>
</a>
