<script lang="ts">
	interface Props {
		title: string;
	}

	let { title }: Props = $props();
</script>

<!-- Section heading in the brand serif — a present voice; the first row's own hairline rules it. -->
<h2 class="font-brand text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
