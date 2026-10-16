<script lang="ts">
	import ImageLightbox from './ImageLightbox.svelte';
	import type { LightboxImage } from './ImageLightbox.svelte';
	import type { Photo } from '#lib/api/index.ts';

	interface Props {
		photos: Photo[];
	}

	let { photos }: Props = $props();

	let selected = $state<LightboxImage | null>(null);
</script>

<section class="flex flex-col gap-6">
	<div class="border-t border-border pt-4">
		<p class="text-sm font-medium text-muted-foreground">Photography</p>
	</div>
	<!-- CSS-columns masonry: mixed aspect ratios never force rows to align (Pinterest-style). -->
	<div class="columns-2 gap-4 md:columns-3">
		{#each photos as photo (photo.src)}
			<button
				type="button"
				class="mb-4 block w-full cursor-zoom-in break-inside-avoid"
				onclick={() => (selected = { src: photo.src, alt: photo.alt })}
			>
				<img
					src={photo.src}
					alt={photo.alt}
					width={photo.width}
					height={photo.height}
					loading="lazy"
					class="w-full rounded-lg border border-border transition-opacity hover:opacity-90"
				/>
			</button>
		{/each}
	</div>
</section>

{#if selected}
	<ImageLightbox image={selected} onclose={() => (selected = null)} />
{/if}
