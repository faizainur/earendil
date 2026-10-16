<script lang="ts">
	import { X } from 'lucide-svelte';
	import type { Photo } from '#lib/api/index.ts';

	interface Props {
		photos: Photo[];
	}

	let { photos }: Props = $props();

	let selected = $state<Photo | null>(null);

	// Esc closes the lightbox while it is open.
	$effect(() => {
		if (!selected) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') selected = null;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
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
				onclick={() => (selected = photo)}
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
	<!-- role="presentation" keeps the a11y rules quiet on this click-away backdrop -->
	<div
		class="fixed inset-0 z-30 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) selected = null;
		}}
	>
		<figure class="flex min-h-0 min-w-0 flex-col">
			<img
				src={selected.src}
				alt={selected.alt}
				class="dialog-zoom max-h-[80vh] max-w-[min(92vw,64rem)] rounded-xl border border-border object-contain shadow-xl"
			/>
			<figcaption class="pt-3 text-center text-sm text-muted-foreground">
				{selected.alt}
			</figcaption>
		</figure>
		<!-- svelte-ignore a11y_autofocus -->
		<button
			type="button"
			autofocus
			class="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition-colors hover:bg-muted"
			aria-label="Close"
			onclick={() => (selected = null)}
		>
			<X class="size-4" />
		</button>
	</div>
{/if}
