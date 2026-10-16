<script lang="ts">
	import PhotoStrip from '#lib/components/PhotoStrip.svelte';
	import PostCard from '#lib/components/PostCard.svelte';
	import SectionLabel from '#lib/components/SectionLabel.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<!-- Hero: display serif headline, "currently" line, featured photograph -->
<section
	class="fade-up mx-auto grid w-full max-w-3xl items-center gap-8 md:grid-cols-[minmax(0,1fr)_240px]"
>
	<div class="flex flex-col gap-6">
		<p class="text-sm font-medium tracking-wide text-primary">Hello, I&rsquo;m Felix.</p>
		<h1 class="font-brand text-5xl leading-[1.05] font-semibold tracking-tight md:text-6xl">
			I write about systems that keep <em class="italic">working</em> under pressure<span
				class="text-brand">;</span
			>
		</h1>
		<p class="max-w-2xl text-lg leading-relaxed text-muted-foreground">
			Backend engineer exploring distributed systems, high-throughput applications, and the quiet
			details behind reliable software.
		</p>
		<!-- Static until the BE grows a status endpoint. -->
		<p class="text-xs text-muted-foreground">
			currently — building queue-depth metrics<span class="text-brand">;</span> reading The Design
			of Everyday Things<span class="text-brand">;</span> running postgres on k3s<span
				class="text-brand">;</span
			>
		</p>
	</div>
	{#if data.featured}
		<a
			href="/gallery"
			class="group hidden md:block"
			aria-label="Featured photograph — view the gallery"
		>
			<img
				src={data.featured.src}
				alt={data.featured.alt}
				width={data.featured.width}
				height={data.featured.height}
				class="aspect-[4/5] w-60 rounded-lg border border-border object-cover grayscale transition duration-500 group-hover:grayscale-0 lg:w-64"
			/>
		</a>
	{:else}
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
	{/if}
</section>

<!-- Selected writing -->
<section
	id="writing"
	class="fade-up mx-auto flex w-full max-w-3xl flex-col gap-6 [animation-delay:120ms]"
>
	<SectionLabel title="Selected writing" />
	<div>
		{#each data.posts as post, i (post.slug)}
			<PostCard {post} index={i + 1} />
		{/each}
	</div>
</section>

<!-- Photography teaser -->
<div class="fade-up [animation-delay:240ms]">
	<PhotoStrip photos={data.photos} />
</div>
