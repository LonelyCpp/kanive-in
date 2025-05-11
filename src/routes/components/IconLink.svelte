<script lang="ts">
	import Icon from '@iconify/svelte';

	interface Props {
		icon: string;
		href: string;
		ariaLabel: string;
		fontSize: number;
	}

	let props: Props = $props();
</script>

<a href={props.href} target="_blank" aria-label={props.ariaLabel}>
	<Icon icon={props.icon} font-size={props.fontSize} />
</a>

<style>
	a {
		color: inherit;
		text-decoration: none;
	}
</style>
