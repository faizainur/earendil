<script lang="ts">
	import PhotoStrip from '#lib/components/PhotoStrip.svelte';
	import PostCard from '#lib/components/PostCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<!-- Hero: text left, mountain line-art visual on the right (hidden below md) -->
<section class="mx-auto grid w-full max-w-3xl items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
	<div class="flex flex-col gap-6">
		<p class="text-sm font-medium tracking-wide text-primary">Hello, I&rsquo;m Faiz Ainur Rofiq.</p>
		<h1 class="text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
			I write about systems that keep working under pressure.
		</h1>
		<p class="max-w-2xl text-lg leading-relaxed text-muted-foreground">
			Backend engineer exploring distributed systems, high-throughput applications, and the quiet
			details behind reliable software.
		</p>
	</div>
	<svg
		viewBox="0 0 400 280"
		fill="none"
		stroke="currentColor"
		aria-hidden="true"
		class="hidden w-56 text-muted-foreground/40 md:block"
	>
		<circle cx="316" cy="58" r="26" stroke-width="2" />
		<path
			d="M12 236 L104 128 L156 184 L238 84 L388 236"
			stroke-width="2.5"
			stroke-linejoin="round"
		/>
		<path
			d="M12 264 L88 192 L148 244 L226 160 L300 232 L388 264"
			stroke-width="2"
			stroke-linejoin="round"
			opacity="0.6"
		/>
	</svg>
</section>

<!-- Selected writing -->
<section id="writing" class="mx-auto flex w-full max-w-3xl flex-col gap-6">
	<div class="border-t border-border pt-4">
		<p class="text-sm font-medium text-muted-foreground">Selected writing</p>
	</div>
	<div>
		{#each data.posts as post (post.slug)}
			<PostCard {post} />
		{/each}
	</div>
</section>

<!-- Photography teaser -->
<PhotoStrip photos={data.photos} />
