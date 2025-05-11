<script>
	import Icon from '@iconify/svelte';
	import IconLink from './components/IconLink.svelte';
</script>

<div class="body">
	<div class="container">
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
					icon="mdi:linkedin"
					href="https://www.linkedin.com/in/ananthu-kanive-18376b61/"
					ariaLabel="LinkedIn"
					fontSize={28}
				/>
				<IconLink
					icon="mdi:stack-overflow"
					href="https://stackoverflow.com/users/3262983/lonelycpp"
					ariaLabel="Stack Overflow"
					fontSize={28}
				/>
			</div>
		</div>
	</div>
</div>

<style>
	.body {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.container {
		display: flex;
		width: 100%;
		flex-direction: column;
		max-width: 720px;
	}

	.hero {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 320px;
	}

	@media (max-width: 720px) {
		.hero {
			height: 260px;
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
