<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search } from 'lucide-svelte';
	import { focusOnMount } from '#lib/actions.ts';
	import { api } from '#lib/api/index.ts';
	import type { PostSummary } from '#lib/api/index.ts';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	const DEBOUNCE_MS = 200;
	const LIMIT = 8;

	const dateFormatter = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: '2-digit',
		year: 'numeric'
	});

	let query = $state('');
	let results = $state<PostSummary[]>([]);
	let loading = $state(false);
	let selected = $state(0);
	let card = $state<HTMLDivElement | undefined>();
	let rowEls = $state<(HTMLAnchorElement | undefined)[]>([]);
	let seeAllEl: HTMLAnchorElement | undefined = $state();

	// suggestPosts() takes no AbortSignal, so a monotonic request sequence
	// supersedes older queries instead: any response whose sequence is no
	// longer current is dropped when it arrives.
	let seq = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const q = query.trim();
		selected = 0;
		clearTimeout(timer);
		const my = ++seq;
		if (!q) {
			results = [];
			loading = false;
			return;
		}
		timer = setTimeout(() => void suggest(q, my), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	});

	async function suggest(q: string, my: number) {
		if (my !== seq) return;
		loading = true;
		try {
			const res = await api.suggestPosts(q, LIMIT);
			if (my === seq) results = res.results;
		} catch {
			if (my === seq) results = [];
		} finally {
			if (my === seq) loading = false;
		}
	}

	// Keyboard selection covers the suggestion rows plus the trailing
	// "see all results" row (index === results.length).
	$effect(() => {
		(selected >= results.length ? seeAllEl : rowEls[selected])?.scrollIntoView({
			block: 'nearest'
		});
	});

	const seeAllHref = $derived(
		query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search'
	);

	// Esc closes while the dialog is mounted (shared behavior with ImageLightbox).
	$effect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	// Simple focus trap: cycle Tab between the input and the visible result
	// links, so focus can never leave the dialog while it is mounted.
	$effect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Tab' || !card) return;
			const nodes = Array.from(card.querySelectorAll<HTMLElement>('input, a[href]'));
			if (nodes.length === 0) return;
			const first = nodes[0];
			const last = nodes[nodes.length - 1];
			const active = document.activeElement;
			if (!card.contains(active)) {
				e.preventDefault();
				first.focus();
			} else if (e.shiftKey && active === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && active === last) {
				e.preventDefault();
				first.focus();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function onInputKeydown(e: KeyboardEvent) {
		const max = results.length; // results.length === the "see all" pseudo-row
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (query.trim()) selected = Math.min(selected + 1, max);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selected = Math.max(selected - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const post = results[selected];
			if (post) void goto(`/posts/${post.slug}`);
			else if (query.trim()) void goto(seeAllHref);
		}
	}
</script>

<!-- role="presentation" keeps the a11y rules quiet on this click-away backdrop -->
<div
	class="fixed inset-0 z-30 flex items-start justify-center bg-background/70 p-4 pt-8 backdrop-blur-sm"
	role="presentation"
	onclick={(e) => {
		if (e.target === e.currentTarget) onClose();
	}}
>
	<div
		bind:this={card}
		role="dialog"
		aria-modal="true"
		aria-label="Search"
		class="dialog-zoom flex max-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow"
	>
		<div class="flex items-center gap-3 border-b border-border px-5 py-4">
			<Search class="size-5 shrink-0 text-muted-foreground" />
			<input
				type="search"
				bind:value={query}
				use:focusOnMount
				aria-label="Search articles"
				placeholder="Type to search…"
				class="w-full bg-card text-lg text-foreground outline-none placeholder:text-muted-foreground"
				onkeydown={onInputKeydown}
			/>
			<kbd class="hidden font-mono text-xs text-muted-foreground md:block">Esc</kbd>
		</div>

		<div class="min-h-0 grow overflow-y-auto p-2">
			{#if loading}
				{#each [0, 1] as i (i)}
					<div class="flex gap-4 rounded-lg px-3 py-3" aria-hidden="true">
						<div class="size-12 shrink-0 animate-pulse rounded-md bg-muted"></div>
						<div class="flex min-w-0 grow flex-col gap-2 py-1">
							<div class="h-3.5 w-2/3 animate-pulse rounded bg-muted"></div>
							<div class="h-3 w-full animate-pulse rounded bg-muted"></div>
							<div class="h-3 w-1/3 animate-pulse rounded bg-muted"></div>
						</div>
					</div>
				{/each}
			{:else if !query.trim()}
				<p class="px-3 py-6 text-sm text-muted-foreground">Type to search…</p>
			{:else if results.length === 0}
				<p class="px-3 py-3 text-sm text-muted-foreground">
					No results for &ldquo;{query.trim()}&rdquo;
				</p>
			{:else}
				{#each results as post, i (post.slug)}
					<a
						bind:this={rowEls[i]}
						href="/posts/{post.slug}"
						class="flex gap-4 rounded-lg px-3 py-3 transition-colors {selected === i
							? 'bg-muted'
							: 'hover:bg-muted'}"
					>
						{#if post.thumbnail}
							<img
								src={post.thumbnail}
								alt=""
								class="size-12 shrink-0 rounded-md border border-border object-cover"
							/>
						{/if}
						<span class="flex min-w-0 flex-col gap-1">
							<span class="text-sm font-medium text-foreground">{post.title}</span>
							<span class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
								{post.preview}
							</span>
							<span class="text-xs text-muted-foreground">
								{dateFormatter.format(new Date(post.date))} · {post.readTime} min read
							</span>
						</span>
					</a>
				{/each}
			{/if}

			{#if query.trim() && !loading}
				<a
					bind:this={seeAllEl}
					href={seeAllHref}
					class="flex items-center gap-2 rounded-lg px-3 py-3 text-sm transition-colors {selected ===
					results.length
						? 'bg-muted font-medium text-foreground'
						: 'text-muted-foreground hover:bg-muted'}"
				>
					→ See all results for &ldquo;{query.trim()}&rdquo;
				</a>
			{/if}
		</div>
	</div>
</div>
