<script lang="ts">
	import { BASE_URL } from '$lib/constants';

	interface Props {
		title: string;
		subtitle: string;
		image_filename: string;
	}

	let props: Props = $props();
</script>

<svelte:head>
	<title>{props.title}</title>
	<meta name="description" content={props.subtitle} />

	<meta property="og:type" content="website" />
	<meta property="og:title" content={props.title} />
	<meta property="og:description" content={props.subtitle} />
	<meta property="og:image" content={`${BASE_URL}/${props.image_filename}`} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={props.title} />
	<meta name="twitter:description" content={props.subtitle} />
	<meta name="twitter:image" content={`${BASE_URL}/${props.image_filename}`} />
	<meta name="twitter:image:width" content="1200" />
	<meta name="twitter:image:height" content="630" />
</svelte:head>
