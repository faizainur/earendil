<script lang="ts">
	import type { Photo } from '#lib/api/index.ts';

	interface Props {
		photos: Photo[];
	}

	let { photos }: Props = $props();
</script>

<section id="photography" class="flex flex-col gap-6">
	<div class="border-t border-border pt-4">
		<p class="text-sm font-medium text-muted-foreground">Photography</p>
	</div>
	<!-- Teaser: uniform fixed-height crops on a calm strip; the mixed-aspect masonry lives on /gallery. -->
	<div class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
		{#each photos as photo (photo.src)}
			<img
				src={photo.src}
				alt={photo.alt}
				loading="lazy"
				class="h-28 w-40 shrink-0 snap-start rounded-md border border-border object-cover md:h-32 md:w-48"
			/>
		{/each}
	</div>
	<a
		href="/gallery"
		class="w-fit text-sm font-medium text-primary transition-colors hover:text-foreground"
	>
		Full gallery →
	</a>
</section>
