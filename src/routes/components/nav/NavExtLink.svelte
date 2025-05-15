<script lang="ts">
	interface Props {
		label: string;
		href: string;
		withUnderline?: boolean;
		bold: boolean;
		fontSize: 24 | 16;
		newTab?: boolean;
	}

	let props: Props = $props();
</script>

<a href={props.href} target={props.newTab ? '_blank' : '_self'}>
	<span
		class:underline={props.withUnderline}
		class:font-bold={props.bold}
		class:font-24={props.fontSize === 24}
		class:font-16={props.fontSize === 16}
	>
		{props.label}
	</span>

	<!-- {#if props.withIcon}
		<div class="icon-container">
			<Icon icon="mdi:open-in-new" font-size="12px" />
		</div>
	{/if} -->
</a>

<style>
	a {
		font-size: 16px;
		font-weight: 400;
		color: var(--secondary);
		text-decoration: none;
		display: flex;
	}

	.font-24 {
		font-size: 24px;
	}

	.font-bold {
		font-weight: 600;
	}

	.underline {
		text-decoration: underline;
		text-underline-offset: 8px;
	}
</style>
