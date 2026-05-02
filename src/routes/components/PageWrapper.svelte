<script>
	let { children } = $props();
</script>

<div class="wrapper">
	{@render children()}
</div>

<style>
	.wrapper {
		display: flex;
		width: 100%;
		height: 100%;
		flex-direction: column;
		max-width: 720px;
		margin: 0 auto 32px auto;
	}
</style>
