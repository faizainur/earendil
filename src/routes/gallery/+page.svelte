<script lang="ts">
	import PhotoGallery from '#lib/components/PhotoGallery.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<PhotoGallery photos={data.photos} />
