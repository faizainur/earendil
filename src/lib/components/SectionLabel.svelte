<script lang="ts">
	interface Props {
		title: string;
	}

	let { title }: Props = $props();
</script>

<div class="border-t border-border pt-4">
	<p class="font-brand text-sm font-medium text-muted-foreground">
		{title}<span class="text-brand">;</span>
	</p>
</div>
