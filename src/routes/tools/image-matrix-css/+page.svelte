<script>
	import img1 from './filter-ba.png';
	import img2 from './filter-ot.png';
	import img3 from './filter-re.png';

	let hueRotate = $state(0);
	let saturate = $state(100);
	let blur = $state(0);
	let brightness = $state(100);
	let contrast = $state(100);
	let dropShadowX = $state(0);
	let dropShadowY = $state(0);
	let dropShadowBlur = $state(0);
	let grayscale = $state(0);
	let invert = $state(0);
	let opacity = $state(100);
	let sepia = $state(0);
	let backgroundColor = $state('#f9f9f9');
	let mixBlendMode = $state('normal');
</script>

<svelte:head>
	<title>Image Matrix CSS</title>
	<meta name="description" content="Image Matrix CSS tester" />
</svelte:head>

<h1>Image Matrix CSS</h1>

<p>
	The filter CSS property applies graphical effects like blur or color shift to an element. Filters
	are commonly used to adjust the rendering of images, backgrounds, and borders.
</p>

<div
	class="image-container"
	style="--hue-rotate: {hueRotate}deg; --saturate: {saturate}%; --blur: {blur}px; --brightness: {brightness /
		100}; --contrast: {contrast}%; --drop-shadow-x: {dropShadowX}px; --drop-shadow-y: {dropShadowY}px; --drop-shadow-blur: {dropShadowBlur}px; --grayscale: {grayscale}%; --invert: {invert}%; --opacity: {opacity}%; --sepia: {sepia}%; --mix-blend-mode: {mixBlendMode}; --background-color: {backgroundColor}"
>
	<img src={img1} alt="test figure 1" />
	<img src={img2} alt="test figure 2" />
	<img src={img3} alt="test figure 3" />
</div>

<div class="inputs">
	<label
		><span class="label-text">Hue Rotate ({hueRotate}°)</span>
		<input type="range" min={0} max={360} class="slider" id="hue-rotate" bind:value={hueRotate} />
	</label>
	<label>
		<span class="label-text">Saturate ({saturate}%)</span>
		<input type="range" min={0} max={200} class="slider" id="saturate" bind:value={saturate} />
	</label>

	<label>
		<span class="label-text">Brightness ({brightness}%)</span>
		<input type="range" min={0} max={200} class="slider" id="brightness" bind:value={brightness} />
	</label>
	<label>
		<span class="label-text">Contrast ({contrast}%)</span>
		<input type="range" min={0} max={300} class="slider" id="contrast" bind:value={contrast} />
	</label>

	<label>
		<span class="label-text">Invert ({invert}%)</span>
		<input type="range" min={0} max={100} class="slider" id="invert" bind:value={invert} />
	</label>
	<label>
		<span class="label-text">Opacity ({opacity}%)</span>
		<input type="range" min={0} max={100} class="slider" id="opacity" bind:value={opacity} />
	</label>
	<label>
		<span class="label-text">Sepia ({sepia}%)</span>
		<input type="range" min={0} max={100} class="slider" id="sepia" bind:value={sepia} />
	</label>

	<label>
		<span class="label-text">BG Color ({backgroundColor})</span>
		<input type="color" id="background-color" bind:value={backgroundColor} />
	</label>

	<label>
		<span class="label-text">Mix Blend Mode</span>
		<select id="mix-blend-mode" bind:value={mixBlendMode}>
			<option value="normal">Normal</option>
			<option value="hue">Hue</option>
			<option value="multiply">Multiply</option>
			<option value="screen">Screen</option>
			<option value="overlay">Overlay</option>
			<option value="darken">Darken</option>
			<option value="lighten">Lighten</option>
			<option value="color-dodge">Color Dodge</option>
			<option value="color-burn">Color Burn</option>
			<option value="hard-light">Hard Light</option>
			<option value="soft-light">Soft Light</option>
			<option value="difference">Difference</option>
			<option value="exclusion">Exclusion</option>
			<option value="saturation">Saturation</option>
			<option value="color">Color</option>
			<option value="luminosity">Luminosity</option>
		</select>
	</label>
</div>

<style>
	.image-container {
		display: flex;
		flex-direction: row;
		gap: 10px;
		padding: 50px;
		background-color: var(--background-color);
	}

	img {
		width: 100px;
		height: 100px;
		object-fit: cover;
		filter: hue-rotate(var(--hue-rotate)) saturate(var(--saturate)) blur(var(--blur))
			brightness(var(--brightness)) contrast(var(--contrast))
			drop-shadow(var(--drop-shadow-x) var(--drop-shadow-y) var(--drop-shadow-blur) blue)
			grayscale(var(--grayscale)) invert(var(--invert)) opacity(var(--opacity)) sepia(var(--sepia));
		mix-blend-mode: var(--mix-blend-mode);
	}

	.inputs {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 24px;
	}

	.label-text {
		display: inline-block;
		font-size: 12px;
		width: 150px;
	}
</style>
