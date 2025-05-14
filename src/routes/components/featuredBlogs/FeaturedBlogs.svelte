<script>
	import FeaturedBlogCard from './FeaturedBlogCard.svelte';
</script>

<h2>Latest</h2>

<div class="featured-blogs">
	<div class="featured-blog">
		<FeaturedBlogCard
			title="Observables in a reactive world"
			description="Maintaining state outside the React component tree"
			link="https://lonelycpp.github.io/2023/11/15/observables-in-a-reactive-world/"
		/>
	</div>
	<div class="featured-blog">
		<FeaturedBlogCard
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
