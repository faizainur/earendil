// markdown-it-task-lists is untyped CJS (no @types package on npm) — minimal shim.
declare module 'markdown-it-task-lists' {
	import type MarkdownIt from 'markdown-it';

	export interface TaskListsOptions {
		/** Render enabled (interactive) checkboxes. Default false. */
		enabled?: boolean;
		label?: boolean;
		labelAfter?: boolean;
	}

	export default function taskLists(md: MarkdownIt, options?: TaskListsOptions): void;
}
