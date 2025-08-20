<script>
	import FeaturedBlogCard from './FeaturedBlogCard.svelte';
</script>

<h2>Latest</h2>

<div class="featured-blogs">
	<div class="featured-blog">
		<FeaturedBlogCard
			title="A game of Wordle"
			description="The game of Wordle built with React Native Web (expo)"
			link="https://lonelycpp.github.io/react-native-wordle/"
		/>
	</div>
	<div class="featured-blog">
		<FeaturedBlogCard
			title="What's in a URL?"
			description="A short break down of the components of a URL"
			link="/blog/whats-in-a-url"
		/>
	</div>
	<div class="featured-blog">
		<FeaturedBlogCard
			newTab
			title="Observables in a reactive world"
			description="Maintaining state outside the React component tree"
			link="https://lonelycpp.github.io/2023/11/15/observables-in-a-reactive-world/"
		/>
	</div>
	<div class="featured-blog">
		<FeaturedBlogCard
			newTab
			title="React Native Animated"
			description="Simple animation primitives in React Native"
			link="https://lonelycpp.github.io/2020/06/18/animations-react-native/"
		/>
	</div>
</div>

<style>
	.featured-blogs {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>
