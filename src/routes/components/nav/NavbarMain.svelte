<script>
	import NavExtLink from './NavExtLink.svelte';
</script>

<nav>
	<div class="container">
		<NavExtLink label="Ananthu Kanive" href="/" withIcon={false} bold={true} fontSize={24} />

		<div class="nav-links">
			<NavExtLink label="Uses" href="/uses" withIcon bold={false} fontSize={16} />
			<NavExtLink
				label="Projects"
				href="http://github.com/lonelyCpp/"
				withIcon
				bold={false}
				fontSize={16}
				newTab
			/>
			<NavExtLink
				label="Contact"
				href="https://www.linkedin.com/in/ananthu-kanive-18376b61/"
				withIcon
				bold={false}
				fontSize={16}
				newTab
			/>
		</div>
	</div>
</nav>

<style>
	nav {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.container {
		flex-direction: row;
		display: flex;
		flex: 1;
		height: 60px;
		max-width: 1072px;

		align-items: center;
	}

	.nav-links {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 16px;
		flex: 1;
	}
</style>
