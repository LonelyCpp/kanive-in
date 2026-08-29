<script>
	import { BASE_URL } from '$lib/constants';
	import SocialHeaders from '../components/SocialHeaders.svelte';
	import IconLink from './components/IconLink.svelte';
	import FeaturedBlogs from './components/featuredBlogs/FeaturedBlogs.svelte';
	import GithubActivityChart from './components/GithubActivityChart.svelte';
	import PageWrapper from './components/PageWrapper.svelte';

	let { data } = $props();
</script>

<SocialHeaders
	title="Ananthu Kanive"
	subtitle="Ananthu Kanive's personal website"
	image_filename="default-og-image.png"
/>

<PageWrapper>
	<div class="hero">
		<h1>Hello World</h1>

		<span class="subtitle">Writing code all day</span>
		<span class="subtitle">react-native | web-tech | android</span>
		<div class="icons">
			<IconLink
				icon="mdi:github"
				href="https://github.com/lonelyCpp/"
				ariaLabel="Github"
				fontSize={28}
			/>
			<IconLink
				icon="mdi:stack-overflow"
				href="https://stackoverflow.com/users/3262983/lonelycpp"
				ariaLabel="Stack Overflow"
				fontSize={28}
			/>
			<IconLink
				icon="mdi:twitter"
				href="https://x.com/ananthu_tweetin"
				ariaLabel="Github"
				fontSize={28}
			/>

			<IconLink
				icon="mdi:linkedin"
				href="https://www.linkedin.com/in/ananthu-kanive-18376b61/"
				ariaLabel="LinkedIn"
				fontSize={28}
			/>
		</div>
	</div>
	<div class="section">
		{#if data.calendar}
			<GithubActivityChart calendar={data.calendar} />
		{/if}
	</div>
	<div class="section">
		<FeaturedBlogs />
	</div>
</PageWrapper>

<style>
	.hero {
		display: flex;
		flex-direction: column;
		padding-top: 88px;
	}

	.section {
		margin-top: 48px;
	}

	@media (max-width: 720px) {
		.hero {
			padding-top: 56px;
		}
	}

	.subtitle {
		font-size: 16px;
		font-weight: 400;
		color: grey;
		margin-bottom: 4px;
	}

	.icons {
		display: flex;
		flex-direction: row;
		gap: 12px;
		margin-top: 12px;
	}
</style>
