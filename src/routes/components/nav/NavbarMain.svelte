<script>
	import Icon from '@iconify/svelte';
	import NavExtLink from './NavExtLink.svelte';

	let isMenuOpen = $state(false);
</script>

<nav>
	<div class="container">
		<NavExtLink label="Ananthu Kanive" href="/" bold={true} fontSize={24} />

		<div class="nav-links-desktop">
			<NavExtLink label="Uses" href="/uses" withUnderline bold={false} fontSize={16} />
			<NavExtLink label="Tools" href="/tools" withUnderline bold={false} fontSize={16} />
			<NavExtLink
				label="Projects"
				href="http://github.com/lonelyCpp/"
				withUnderline
				bold={false}
				fontSize={16}
				newTab
			/>
		</div>

		<div class="nav-links-mobile">
			<button
				class="menu-button"
				onclick={() => {
					isMenuOpen = !isMenuOpen;
				}}
			>
				<Icon icon={isMenuOpen ? 'mdi:close' : 'mdi:menu'} font-size="24px" />
			</button>
			{#if isMenuOpen}
				<div class="menu-container">
					<NavExtLink label="Uses" href="/uses" withUnderline bold={false} fontSize={16} />
					<NavExtLink label="Tools" href="/tools" withUnderline bold={false} fontSize={16} />
					<NavExtLink
						label="Projects"
						href="http://github.com/lonelyCpp/"
						withUnderline
						bold={false}
						fontSize={16}
					/>
				</div>
			{/if}
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

	.nav-links-desktop {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 16px;
		flex: 1;
	}

	.nav-links-mobile {
		display: none;
		flex: 1;
		justify-content: flex-end;
	}

	.menu-button {
		background-color: transparent;
		border: none;
		cursor: pointer;
		width: 24px;
		height: 24px;
		margin-right: 8px;
	}

	.menu-container {
		position: fixed;
		display: flex;
		flex-direction: column;
		top: 60px;
		right: 14px;
		padding: 16px;
		gap: 24px;
		background-color: var(--surface-color);
		box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
		z-index: 10;
	}

	@media screen and (max-width: 720px) {
		.nav-links-desktop {
			display: none;
		}

		.nav-links-mobile {
			display: flex;
		}
	}
</style>
