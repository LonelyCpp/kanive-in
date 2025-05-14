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

<a
	href={props.href}
	target="_blank"
	aria-label={props.ariaLabel}
	style="--box-size: {props.fontSize}px"
>
	<Icon icon={props.icon} font-size={props.fontSize} />
</a>

<style>
	a {
		color: inherit;
		text-decoration: none;
		height: var(--box-size);
		width: var(--box-size);
	}
</style>
