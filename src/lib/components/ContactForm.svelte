<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	// Shape mirrors the `contact` action's return values in +page.server.ts.
	const form = $derived(
		page.form as
			{ ok?: boolean; error?: string; name?: string; email?: string; message?: string } | undefined
	);
	const sent = $derived(form?.ok === true);
	const error = $derived(form?.error ?? '');
</script>

{#if sent}
	<p class="text-sm text-foreground" role="status">Thanks — your message has been sent.</p>
{:else}
	<form method="POST" action="?/contact#contact" class="flex flex-col gap-3 {className}">
		<div class="flex flex-wrap gap-3">
			<label class="flex flex-col gap-1 text-sm text-muted-foreground">
				Name
				<input
					name="name"
					type="text"
					required
					autocomplete="name"
					value={form?.name ?? ''}
					class="w-full min-w-40 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:w-44"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm text-muted-foreground">
				Email
				<input
					name="email"
					type="email"
					required
					autocomplete="email"
					value={form?.email ?? ''}
					class="w-full min-w-40 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:w-44"
				/>
			</label>
		</div>
		<label class="flex flex-col gap-1 text-sm text-muted-foreground">
			Message
			<textarea
				name="message"
				required
				rows="3"
				class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
				>{form?.message ?? ''}</textarea
			>
		</label>
		{#if error}
			<p class="text-sm text-destructive" role="alert">{error}</p>
		{/if}
		<button
			type="submit"
			class="w-fit rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
		>
			Send message
		</button>
	</form>
{/if}
