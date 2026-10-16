import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => ({
	theme: cookies.get('theme') === 'dark' ? ('dark' as const) : ('light' as const)
});
