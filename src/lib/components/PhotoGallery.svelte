<script lang="ts">
	import type { Photo } from '#lib/api/index.ts';

	interface Props {
		photos: Photo[];
	}

	let { photos }: Props = $props();
</script>

<section class="flex flex-col gap-6">
	<div class="border-t border-border pt-4">
		<p class="text-sm font-medium text-muted-foreground">Photography</p>
	</div>
	<!-- CSS-columns masonry: mixed aspect ratios never force rows to align (Pinterest-style). -->
	<div class="columns-2 gap-4 md:columns-3">
		{#each photos as photo (photo.src)}
			<img
				src={photo.src}
				alt={photo.alt}
				width={photo.width}
				height={photo.height}
				loading="lazy"
				class="mb-4 w-full break-inside-avoid rounded-lg border border-border"
			/>
		{/each}
	</div>
</section>
