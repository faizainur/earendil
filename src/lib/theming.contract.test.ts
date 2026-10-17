import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The theming maintenance contract.
 *
 * Diagram colors live ONLY as `--diagram-*` tokens in layout.css; the JS side
 * (`MERMAID_VARS`/`RAMP` in actions.ts) is a pure token→variable mapping.
 * These two files are the only coupled pair in the diagram pipeline, so the
 * coupling is owned by tests instead of code review:
 *
 *  1. mermaid reads hex colors only (`#rgb`/`#rrggbb`) — it silently ignores
 *     `red`, `oklch()`, etc. — so every diagram token value must be bare hex.
 *  2. every token defined in one theme must also exist in the other (a diagram
 *     rendered at theme-flip time must find its colors in both modes).
 *  3. every token referenced by the JS mapping must actually exist in the CSS.
 */

const css = readFileSync(new URL('../routes/layout.css', import.meta.url), 'utf8');
const actions = readFileSync(new URL('./actions.ts', import.meta.url), 'utf8');

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `{ token: Set<themeSelector> }` for the two blocks that define diagram tokens. */
function diagramTokensByBlock(): Map<string, number> {
	const counts = new Map<string, number>();
	for (const match of css.matchAll(/(--diagram-[\w-]+):/g)) {
		counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
	}
	return counts;
}

describe('theming contract — layout.css ↔ actions.ts', () => {
	it('every --diagram-* value in layout.css is a bare hex color', () => {
		const values = [...css.matchAll(/--diagram-[\w-]+:\s*([^;]+);/g)].map((m) => m[1].trim());
		expect(values.length).toBeGreaterThan(0);
		for (const value of values) {
			expect(value, `mermaid reads hex only — "${value}" would be ignored`).toMatch(HEX);
		}
	});

	it('every --diagram-* token is defined in both themes (light + dark parity)', () => {
		const counts = diagramTokensByBlock();
		expect(counts.size).toBeGreaterThan(0);
		for (const [token, n] of counts) {
			expect(n, `${token} must appear once in :root and once in [data-theme='dark']`).toBe(2);
		}
	});

	it('every token the mermaid mapping references exists in layout.css', () => {
		const refs = [...actions.matchAll(/'(--diagram-[\w-]+)'/g)].map((m) => m[1]);
		expect(refs.length).toBeGreaterThan(0);
		for (const token of refs) {
			expect(css, `${token} is mapped in actions.ts but not defined in layout.css`).toContain(
				`${token}:`
			);
		}
	});
});
