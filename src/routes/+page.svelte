<script lang="ts">
	import PostCard from '#lib/components/PostCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<section class="flex flex-col gap-6">
	<p class="text-sm font-medium tracking-wide text-primary">Hello, I&rsquo;m Felix.</p>
	<h1 class="max-w-3xl text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
		I write about systems that keep working under pressure.
	</h1>
	<p class="max-w-2xl text-lg leading-relaxed text-muted-foreground">
		Backend engineer exploring distributed systems, high-throughput applications, and the quiet
		details behind reliable software.
	</p>

	<div class="border-t border-border pt-4">
		<p class="text-sm font-medium text-muted-foreground">Selected writing</p>
	</div>
	<div>
		{#each data.posts as post (post.slug)}
			<PostCard {post} />
		{/each}
	</div>
</section>
