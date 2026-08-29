import { env } from '$env/dynamic/private';
import { fetchContributionCalendar, GITHUB_USERNAME } from '$lib/github';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({
		'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
	});

	const token = env.GITHUB_TOKEN;
	if (!token) {
		return { calendar: null };
	}

	const calendar = await fetchContributionCalendar(GITHUB_USERNAME, token);
	return { calendar };
};
