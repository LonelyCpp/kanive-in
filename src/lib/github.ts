export const GITHUB_USERNAME = 'lonelyCpp';

export type ContributionDay = { date: string; count: number };

export type GithubCalendar = {
	totalContributions: number;
	weeks: ContributionDay[][];
};

const QUERY = `
query($user: String!, $from: DateTime!, $to: DateTime!) {
	user(login: $user) {
		contributionsCollection(from: $from, to: $to) {
			contributionCalendar {
				totalContributions
				weeks {
					contributionDays {
						date
						contributionCount
					}
				}
			}
		}
	}
}`;

type GraphQLResponse = {
	data?: {
		user?: {
			contributionsCollection?: {
				contributionCalendar?: {
					totalContributions?: number;
					weeks?: { contributionDays?: { date?: string; contributionCount?: number }[] }[];
				};
			};
		};
	};
};

export async function fetchContributionCalendar(
	username: string,
	token: string
): Promise<GithubCalendar | null> {
	const to = new Date();
	const from = new Date(to);
	from.setDate(from.getDate() - 364);

	try {
		const res = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: QUERY,
				variables: { user: username, from: from.toISOString(), to: to.toISOString() }
			})
		});

		if (!res.ok) return null;

		const json = (await res.json()) as GraphQLResponse;
		const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
		if (!calendar?.weeks) return null;

		const weeks = calendar.weeks.map((week) =>
			(week.contributionDays ?? [])
				.map((day): ContributionDay | null =>
					day.date ? { date: day.date, count: day.contributionCount ?? 0 } : null
				)
				.filter((day): day is ContributionDay => day !== null)
		);
		if (weeks.some((week) => week.length === 0)) return null;

		return { totalContributions: calendar.totalContributions ?? 0, weeks };
	} catch {
		return null;
	}
}
