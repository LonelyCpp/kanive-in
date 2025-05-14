<script>
	import ToolsCard from './components/ToolsCard.svelte';
</script>

<div class="container">
	<h1>Tools</h1>
	<p>Handy tools that I've created to make life easier</p>

	<div class="tools-container">
		<ToolsCard
			title="URL visualizer"
			description="Decode and visualize the parts of a URL"
			link="/tools/url-visualizer"
		/>
		<ToolsCard
			title="Generate a firebase URL (smallcase app)"
			description="Generate a firebase URL for the smallcase app"
			link="/tools/smallcase-firebase-url-generator"
		/>
	</div>
</div>

<style>
	.container {
		margin-top: 48px;
	}

	.tools-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 32px;
	}
</style>
