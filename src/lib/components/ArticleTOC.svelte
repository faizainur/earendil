<script lang="ts">
	// Type-only import — `render.ts` itself is server-side only and must not be bundled.
	import type { TocEntry } from '#lib/markdown/render.ts';

	interface Props {
		toc: TocEntry[];
		/** 'inline' = under the title (mobile); 'sticky' = right rail (desktop). */
		variant?: 'inline' | 'sticky';
	}

	let { toc, variant = 'inline' }: Props = $props();
</script>

{#if toc.length > 0}
	<nav
		aria-label="On this page"
		class={variant === 'inline'
			? 'border-y border-border py-5 text-sm'
			: 'border-l border-border pl-6 text-sm'}
	>
		<h2 class="mb-3 font-brand text-sm font-semibold text-muted-foreground">
			Contents<span class="text-brand">;</span>
		</h2>
		<ul class={variant === 'inline' ? 'grid gap-2' : 'grid gap-3'}>
			{#each toc as entry (entry.id)}
				<li class={entry.depth === 3 ? 'pl-3' : undefined}>
					<a
						href="#{entry.id}"
						data-toc-link={entry.id}
						class="text-muted-foreground transition-colors hover:text-foreground data-[active]:text-foreground"
					>
						{entry.text}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
