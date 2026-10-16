<script lang="ts">
	interface Props {
		title: string;
	}

	let { title }: Props = $props();
</script>

<!-- Quiet kicker: the rows' own hairlines do the framing; the motif lives elsewhere. -->
<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">{title}</p>
