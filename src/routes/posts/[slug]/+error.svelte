<script lang="ts">
	import { page } from '$app/state';
</script>

<section class="flex flex-col items-start gap-4 py-12">
	<h1 class="text-3xl font-semibold tracking-tight text-foreground">
		{page.status === 404 ? 'Post not found' : 'Something went wrong'}
	</h1>
	<p class="text-muted-foreground">
		{page.status === 404
			? "We couldn't find that article. It may have moved or never existed."
			: (page.error?.message ?? 'An unexpected error occurred.')}
	</p>
	<a
		href="/articles"
		class="font-medium text-primary underline underline-offset-4 transition-colors hover:text-foreground"
	>
		← Back to all articles
	</a>
</section>
