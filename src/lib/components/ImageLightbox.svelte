<script lang="ts">
	import { X } from 'lucide-svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';
	import { focusOnMount } from '#lib/actions.ts';

	export interface LightboxImage {
		src: string;
		alt: string;
	}

	interface Props {
		image: LightboxImage;
		onclose: () => void;
	}

	let { image, onclose }: Props = $props();

	// Symmetric open/close motion, identical language to the search palette.
	const reduced = $derived(
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
	const fadeOpts = $derived({ duration: reduced ? 0 : 150 });
	const scaleOpts = $derived({ start: 0.94, duration: reduced ? 0 : 150, easing: cubicOut });

	// Esc closes the lightbox while it is mounted.
	$effect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onclose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<!-- role="presentation" keeps the a11y rules quiet on this click-away backdrop -->
<div
	class="fixed inset-0 z-30 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
	role="presentation"
	transition:fade={fadeOpts}
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
>
	<figure class="flex min-h-0 min-w-0 flex-col" transition:scale={scaleOpts}>
		<img
			src={image.src}
			alt={image.alt}
			class="max-h-[80vh] max-w-[min(92vw,64rem)] rounded-xl border border-border object-contain shadow-xl"
		/>
		<figcaption class="pt-3 text-center text-sm text-muted-foreground">{image.alt}</figcaption>
	</figure>
	<button
		type="button"
		use:focusOnMount
		class="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition-colors hover:bg-muted"
		aria-label="Close"
		onclick={onclose}
	>
		<X class="size-4" />
	</button>
</div>
