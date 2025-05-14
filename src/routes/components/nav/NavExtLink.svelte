<script lang="ts">
	import Icon from '@iconify/svelte';

	interface Props {
		label: string;
		href: string;
		withIcon: boolean;
		bold: boolean;
		fontSize: 24 | 16;
		newTab?: boolean;
	}

	let props: Props = $props();
</script>

<a href={props.href} target={props.newTab ? '_blank' : '_self'}>
	<span
		class:font-bold={props.bold}
		class:font-24={props.fontSize === 24}
		class:font-16={props.fontSize === 16}
	>
		{props.label}
	</span>

	{#if props.withIcon}
		<div class="icon-container">
			<Icon icon="mdi:open-in-new" font-size="12px" />
		</div>
	{/if}
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

	.icon-container {
		height: 12px;
		width: 12px;
		margin-left: 4px;
	}
</style>
