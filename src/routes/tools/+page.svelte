<script>
	import ToolsCard from './components/ToolsCard.svelte';
	import PageWrapper from '../components/PageWrapper.svelte';
</script>

<PageWrapper>
	<h1>Tools</h1>
	<p>Handy tools that I've created to make life easier</p>

	<div class="tools-container">
		<ToolsCard
			title="URL visualizer"
			description="Decode and visualize the parts of a URL"
			link="/tools/url-visualizer"
		/>
		<ToolsCard
			title="Generate a shareable app URL (smallcase app)"
			description="Generate a URL for the smallcase app"
			link="/tools/smallcase-firebase-url-generator"
		/>
		<ToolsCard
			title="Image Matrix CSS"
			description="Test out the image matrix CSS"
			link="/tools/image-matrix-css"
		/>
		<ToolsCard
			title="Airline Print"
			description="Generate beautiful, print-friendly flight reservation tickets"
			link="/tools/airline-print"
		/>
	</div>
</PageWrapper>

<style>
	h1 {
		margin-top: 48px;
	}

	.tools-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 32px;
	}
</style>
