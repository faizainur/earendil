import { describe, expect, it } from 'vitest';
import { svgForZoom } from './actions.ts';

/**
 * The zoom snapshot leaves the page: mermaid's SVG becomes an `<img>` src, where
 * its inline sizing (viewBox + `max-width` style / percentage dims) provides no
 * intrinsic size and browsers fall back to a tiny default box. svgForZoom must
 * bake explicit px dimensions from the viewBox.
 */
describe('svgForZoom — intrinsic size for the lightbox snapshot', () => {
	it('bakes px width/height from the viewBox and drops inline-only sizing', () => {
		const mermaid =
			'<svg id="m" role="graphics-document" style="max-width: 554.45px;" viewBox="0 0 554.45 175.5" xmlns="http://www.w3.org/2000/svg" width="100%"><g></g></svg>';
		const out = svgForZoom(mermaid);
		expect(out).toContain('width="555"');
		expect(out).toContain('height="176"');
		expect(out).not.toContain('max-width');
		expect(out).not.toContain('width="100%"');
		expect(out).toContain('viewBox="0 0 554.45 175.5"'); // geometry untouched
	});

	it('is idempotent', () => {
		const once = svgForZoom('<svg viewBox="0 0 20 10"></svg>');
		expect(svgForZoom(once)).toBe(once);
	});

	it('passes through an SVG without a viewBox (nothing to compute from)', () => {
		const plain = '<svg width="80" height="60"><rect/></svg>';
		expect(svgForZoom(plain)).toBe(plain);
	});
});
