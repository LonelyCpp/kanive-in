<script lang="ts">
	import { onMount } from 'svelte';

	interface ImageItem {
		name: string;
		url: string;
		size: string;
		type: string;
		file?: File; // Store the original file for copying
	}

	let images: ImageItem[] = [];
	let likedImages: ImageItem[] = [];
	let selectedFolder: string | null = null;
	let loading = false;
	let error: string | null = null;
	let currentView: 'all' | 'liked' = 'all';
	let currentIndex = 0;
	let showSlideshow = false;
	let savingLiked = false;
	let saveSuccess = false;
	let restoring = false;

	const fileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
	const STORAGE_KEY = 'photo-selector-state';
	const DB_NAME = 'photo-selector-db';
	const DB_VERSION = 1;

	// IndexedDB utilities for storing directory handle
	async function openDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains('handles')) {
					db.createObjectStore('handles');
				}
			};
		});
	}

	async function saveDirectoryHandle(handle: any) {
		try {
			const db = await openDB();
			const transaction = db.transaction(['handles'], 'readwrite');
			const store = transaction.objectStore('handles');
			await store.put(handle, 'directory');
		} catch (err) {
			console.error('Failed to save directory handle:', err);
		}
	}

	async function getDirectoryHandle(): Promise<any> {
		try {
			const db = await openDB();
			const transaction = db.transaction(['handles'], 'readonly');
			const store = transaction.objectStore('handles');
			return new Promise((resolve, reject) => {
				const request = store.get('directory');
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});
		} catch (err) {
			console.error('Failed to get directory handle:', err);
			return null;
		}
	}

	// Save state to localStorage
	function saveState() {
		const state = {
			likedImageNames: likedImages.map((img) => img.name),
			selectedFolder,
			currentView,
			currentIndex,
			timestamp: Date.now()
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	}

	// Load state from localStorage
	function loadState() {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const state = JSON.parse(stored);
				// Only restore if saved within the last 24 hours
				if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
					return state;
				}
			} catch (err) {
				console.error('Failed to parse stored state:', err);
			}
		}
		return null;
	}

	async function restoreSession() {
		const state = loadState();
		if (!state) return;

		try {
			restoring = true;

			const dirHandle = await getDirectoryHandle();
			if (!dirHandle) return;

			// Verify handle is still valid
			await dirHandle.values().next();

			selectedFolder = state.selectedFolder;
			currentView = state.currentView;
			currentIndex = state.currentIndex;

			// Reload images from directory
			await loadImagesFromHandle(dirHandle, state.likedImageNames);

			// Auto start slideshow if we were in 'all' view
			if (currentView === 'all' && images.length > 0) {
				showSlideshow = true;
			}
		} catch (err) {
			console.error('Failed to restore session:', err);
			// Clear invalid state
			localStorage.removeItem(STORAGE_KEY);
		} finally {
			restoring = false;
		}
	}

	async function loadImagesFromHandle(dirHandle: any, likedImageNames: string[] = []) {
		images = [];
		likedImages = [];

		// Process all files in the directory
		// @ts-ignore - File System Access API
		for await (const entry of dirHandle.values()) {
			if (entry.kind === 'file') {
				try {
					// @ts-ignore - File System Access API
					const file = await entry.getFile();
					if (fileTypes.includes(file.type)) {
						const url = URL.createObjectURL(file);
						const imageItem = {
							name: file.name,
							url,
							size: formatFileSize(file.size),
							type: file.type,
							file
						};
						images = [...images, imageItem];

						// Restore liked status
						if (likedImageNames.includes(file.name)) {
							likedImages = [...likedImages, imageItem];
						}
					}
				} catch (err) {
					console.error(`Error processing file ${entry.name}:`, err);
				}
			}
		}

		// Sort images by name
		images.sort((a, b) => a.name.localeCompare(b.name));
	}

	async function selectFolder() {
		try {
			error = null;
			loading = true;
			saveSuccess = false;

			// Check if File System Access API is supported
			if (!('showDirectoryPicker' in window)) {
				throw new Error('Your browser does not support the File System Access API.');
			}

			// Open directory picker using type assertion
			// @ts-ignore - File System Access API
			const dirHandle = await window.showDirectoryPicker();
			selectedFolder = dirHandle.name;

			// Save directory handle for persistence
			await saveDirectoryHandle(dirHandle);

			// Clear previous state
			currentIndex = 0;
			currentView = 'all';

			// Load images from directory
			await loadImagesFromHandle(dirHandle);

			// Save initial state
			saveState();

			// Automatically start slideshow if images are found
			if (images.length > 0) {
				showSlideshow = true;
			}
		} catch (err: unknown) {
			console.error('Error selecting folder:', err);
			error = err instanceof Error ? err.message : 'An unknown error occurred';
		} finally {
			loading = false;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' bytes';
		else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function toggleLike(image: ImageItem) {
		const isLiked = likedImages.some((img) => img.name === image.name);

		if (isLiked) {
			likedImages = likedImages.filter((img) => img.name !== image.name);
		} else {
			likedImages = [...likedImages, image];
		}

		// Save state after liking/unliking
		saveState();
	}

	function isLiked(image: ImageItem): boolean {
		return likedImages.some((img) => img.name === image.name);
	}

	function startSlideshow() {
		showSlideshow = true;
		currentIndex = 0;
		saveState();
	}

	function exitSlideshow() {
		showSlideshow = false;
		saveState();
	}

	function nextImage() {
		const displayedImages = currentView === 'all' ? images : likedImages;
		currentIndex = (currentIndex + 1) % displayedImages.length;
		saveState();
	}

	function prevImage() {
		const displayedImages = currentView === 'all' ? images : likedImages;
		currentIndex = (currentIndex - 1 + displayedImages.length) % displayedImages.length;
		saveState();
	}

	function switchView(view: 'all' | 'liked') {
		currentView = view;
		currentIndex = 0;

		// Auto start slideshow in 'all' mode, exit slideshow in 'liked' mode
		if (view === 'all' && images.length > 0) {
			showSlideshow = true;
		} else if (view === 'liked') {
			showSlideshow = false;
		}

		saveState();
	}

	async function saveLikedImages() {
		if (likedImages.length === 0) {
			error = 'No liked images to save';
			return;
		}

		try {
			savingLiked = true;
			error = null;
			saveSuccess = false;

			// Request permission to create a folder
			// @ts-ignore - File System Access API
			const directoryHandle = await window.showDirectoryPicker({
				id: 'save-liked-photos',
				startIn: 'pictures',
				mode: 'readwrite',
				suggestedName: 'Liked Photos'
			});

			// Create files in the new directory
			for (const image of likedImages) {
				if (image.file) {
					try {
						// @ts-ignore - File System Access API
						const fileHandle = await directoryHandle.getFileHandle(image.name, { create: true });
						// @ts-ignore - File System Access API
						const writable = await fileHandle.createWritable();
						await writable.write(image.file);
						await writable.close();
					} catch (err) {
						console.error(`Error saving ${image.name}:`, err);
					}
				}
			}

			saveSuccess = true;
		} catch (err: unknown) {
			console.error('Error saving liked images:', err);
			error = err instanceof Error ? err.message : 'An unknown error occurred';
			saveSuccess = false;
		} finally {
			savingLiked = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!showSlideshow) return;

		switch (event.key) {
			case 'ArrowRight':
				nextImage();
				break;
			case 'ArrowLeft':
				prevImage();
				break;
			case 'Escape':
				exitSlideshow();
				break;
			case 'Enter':
				// Toggle like status when Enter is pressed
				const displayedImages = currentView === 'all' ? images : likedImages;
				if (displayedImages.length > 0) {
					toggleLike(displayedImages[currentIndex]);
				}
				break;
		}
	}

	// Clean up object URLs when component is unmounted
	onMount(() => {
		window.addEventListener('keydown', handleKeydown);

		// Try to restore previous session
		restoreSession();

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			images.forEach((image) => URL.revokeObjectURL(image.url));
		};
	});
</script>

<svelte:head>
	{#if showSlideshow}
		<style>
			body {
				overflow: hidden;
			}
		</style>
	{/if}
</svelte:head>

<h1>Photo Selector</h1>

<div class="container" class:fullscreen={showSlideshow}>
	{#if !showSlideshow}
		<div class="controls">
			<button class="select-button" on:click={selectFolder} disabled={loading || restoring}>
				{loading ? 'Loading...' : restoring ? 'Restoring...' : 'Select Folder'}
			</button>

			{#if selectedFolder}
				<p class="folder-name">Selected folder: <strong>{selectedFolder}</strong></p>
			{/if}

			{#if error}
				<p class="error">{error}</p>
			{/if}

			{#if saveSuccess}
				<p class="success">Liked images saved successfully!</p>
			{/if}

			{#if restoring}
				<p class="info">Restoring your previous session...</p>
			{/if}
		</div>

		{#if images.length > 0}
			<div class="view-controls">
				<div class="view-tabs">
					<button
						class="tab-button"
						class:active={currentView === 'all'}
						on:click={() => switchView('all')}
					>
						All Images ({images.length})
					</button>
					<button
						class="tab-button"
						class:active={currentView === 'liked'}
						on:click={() => switchView('liked')}
					>
						Liked Images ({likedImages.length})
					</button>
				</div>

				<div class="action-buttons">
					{#if currentView === 'all' && images.length > 0}
						<button class="action-button" on:click={startSlideshow}> Start Slideshow </button>
					{/if}

					{#if likedImages.length > 0}
						<button class="action-button" on:click={saveLikedImages} disabled={savingLiked}>
							{savingLiked ? 'Saving...' : 'Save Liked Images'}
						</button>
					{/if}
				</div>
			</div>

			{#if currentView === 'all'}
				<div class="image-summary">
					<p>Your folder contains {images.length} images. Click "Start Slideshow" to view them.</p>
					<p>Use ← → arrow keys to navigate. Press Enter to like an image.</p>
					<p>You have liked {likedImages.length} image{likedImages.length === 1 ? '' : 's'}.</p>
					<p class="persistence-note">
						💾 Your progress is automatically saved and will be restored if you reload the page.
					</p>
				</div>
			{:else if currentView === 'liked'}
				<div class="image-count">
					{likedImages.length} liked image{likedImages.length === 1 ? '' : 's'}
				</div>

				{#if likedImages.length > 0}
					<div class="image-grid">
						{#each likedImages as image}
							<div class="image-card">
								<div class="image-container">
									<img src={image.url} alt={image.name} loading="lazy" />
									<button class="like-button liked" on:click={() => toggleLike(image)}> ❤️ </button>
								</div>
								<div class="image-info">
									<div class="image-name">{image.name}</div>
									<div class="image-meta">{image.size} • {image.type.split('/')[1]}</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="no-images">No liked images yet. Go to All Images to like some photos.</p>
				{/if}
			{/if}
		{:else if selectedFolder && !loading && !restoring}
			<p class="no-images">No images found in the selected folder.</p>
		{/if}
	{:else}
		<!-- Slideshow View -->
		<div class="slideshow">
			<div class="slideshow-controls">
				<button class="nav-button" on:click={prevImage}> ◀ </button>
				<button class="exit-button" on:click={exitSlideshow}> Exit Slideshow </button>
				<button class="nav-button" on:click={nextImage}> ▶ </button>
			</div>

			{#if currentView === 'all' && images.length > 0}
				<div class="slide-counter">
					{currentIndex + 1} / {images.length} • {likedImages.length} liked
				</div>
				<div class="slideshow-content">
					<img src={images[currentIndex].url} alt={images[currentIndex].name} />
					<div class="slideshow-caption">
						<span>{images[currentIndex].name}</span>
					</div>
					<button
						class="like-button large"
						class:liked={isLiked(images[currentIndex])}
						on:click={() => toggleLike(images[currentIndex])}
					>
						{isLiked(images[currentIndex]) ? '❤️' : '🤍'}
					</button>
					<div class="slideshow-hint">
						Press <span class="key">←</span> <span class="key">→</span> to navigate • Press
						<span class="key">Enter</span> to like
					</div>
				</div>
			{:else if currentView === 'liked' && likedImages.length > 0}
				<div class="slide-counter">
					{currentIndex + 1} / {likedImages.length}
				</div>
				<div class="slideshow-content">
					<img src={likedImages[currentIndex].url} alt={likedImages[currentIndex].name} />
					<div class="slideshow-caption">
						<span>{likedImages[currentIndex].name}</span>
					</div>
					<button
						class="like-button large liked"
						on:click={() => toggleLike(likedImages[currentIndex])}
					>
						❤️
					</button>
					<div class="slideshow-hint">
						Press <span class="key">←</span> <span class="key">→</span> to navigate • Press
						<span class="key">Enter</span> to unlike
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}

	.fullscreen {
		max-width: none;
		height: 100vh;
		padding: 0;
		background-color: rgba(0, 0, 0, 0.9);
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		display: flex;
		flex-direction: column;
	}

	.controls {
		margin-bottom: 2rem;
	}

	.select-button {
		background-color: #3b82f6;
		color: white;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.select-button:hover {
		background-color: #2563eb;
	}

	.select-button:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}

	.folder-name {
		margin-top: 0.75rem;
		font-size: 1rem;
	}

	.error {
		color: #ef4444;
		margin-top: 0.75rem;
	}

	.success {
		color: #22c55e;
		margin-top: 0.75rem;
	}

	.info {
		color: #3b82f6;
		margin-top: 0.75rem;
	}

	.image-count {
		margin-bottom: 1rem;
		font-size: 1.125rem;
		font-weight: 500;
	}

	.image-summary {
		margin-top: 2rem;
		margin-bottom: 2rem;
		padding: 1.5rem;
		border-radius: 0.5rem;
		background-color: #f3f4f6;
		text-align: center;
		line-height: 1.6;
	}

	.persistence-note {
		font-size: 0.875rem;
		color: #6b7280;
		margin-top: 0.75rem;
		font-style: italic;
	}

	.view-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.view-tabs {
		display: flex;
		gap: 0.5rem;
	}

	.tab-button {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		background-color: white;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab-button.active {
		background-color: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.action-button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background-color: #4b5563;
		color: white;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.action-button:hover {
		background-color: #374151;
	}

	.action-button:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}

	.image-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.image-card {
		border-radius: 0.5rem;
		overflow: hidden;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		background-color: white;
		transition: transform 0.2s;
	}

	.image-card:hover {
		transform: translateY(-4px);
	}

	.image-container {
		position: relative;
	}

	.image-card img {
		width: 100%;
		height: 200px;
		object-fit: cover;
		display: block;
	}

	.like-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		border: none;
		background-color: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1rem;
		transition:
			transform 0.2s,
			background-color 0.2s;
	}

	.like-button:hover {
		transform: scale(1.1);
	}

	.like-button.large {
		position: absolute;
		bottom: 4rem;
		right: 2rem;
		width: 3.5rem;
		height: 3.5rem;
		font-size: 1.75rem;
		background-color: rgba(255, 255, 255, 0.9);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.image-info {
		padding: 0.75rem;
	}

	.image-name {
		font-weight: 500;
		margin-bottom: 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.image-meta {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.no-images {
		text-align: center;
		color: #6b7280;
		padding: 3rem 0;
	}

	/* Slideshow styles */
	.slideshow {
		flex: 1;
		display: flex;
		flex-direction: column;
		color: white;
	}

	.slideshow-controls {
		display: flex;
		justify-content: space-between;
		padding: 1rem;
		background-color: rgba(0, 0, 0, 0.5);
	}

	.nav-button {
		background-color: transparent;
		color: white;
		border: 1px solid white;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1.5rem;
		transition: background-color 0.2s;
	}

	.nav-button:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.exit-button {
		background-color: #ef4444;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.exit-button:hover {
		background-color: #dc2626;
	}

	.slide-counter {
		text-align: center;
		padding: 0.5rem;
		font-size: 0.875rem;
	}

	.slideshow-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		position: relative;
	}

	.slideshow-content img {
		max-height: 75vh;
		max-width: 90%;
		object-fit: contain;
		border-radius: 0.375rem;
	}

	.slideshow-caption {
		margin-top: 1rem;
		font-size: 1.125rem;
	}

	.slideshow-hint {
		position: absolute;
		bottom: 1rem;
		left: 0;
		right: 0;
		text-align: center;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.key {
		display: inline-block;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 0.25rem;
		padding: 0.125rem 0.375rem;
		margin: 0 0.125rem;
		font-family: monospace;
	}
</style>
