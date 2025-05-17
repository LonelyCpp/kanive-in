<script>
	import BlogHero from '../components/BlogHero.svelte';
</script>

<svelte:head>
	<title>What's in a URL?</title>
	<meta
		name="description"
		content="URLs (Uniform Resource Locators) are the building blocks of the web. In this article, we'll break down the key components of a URL, explaining each part and its
				purpose."
	/>
	<meta property="og:image" content="/what-in-a-url-og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
</svelte:head>

<div>
	<BlogHero title="What's in a URL?" subtitle="A short break down of the components of a URL" />

	<div class="content-container">
		<div class="content-block">
			<p>
				URLs <i>(Uniform Resource Locators)</i> are the building blocks of the web, guiding us to websites,
				documents, images, and other resources on the internet. Although we interact with URLs daily,
				many people are unaware of their underlying structure.
			</p>
		</div>

		<div class="content-block">
			<h2 id="parts-of-a-url">Parts of a URL</h2>
			<p>
				In this article, we'll break down the key components of a URL, explaining each part and its
				purpose.
			</p>
			<div>
				<span class="url-parts">
					<a href="#protocol"><span class="url-part scheme-part">https:</span></a>
					<span class="url-part separator-part">//</span>
					<a href="#host"><span class="url-part host-part">subdomain.domain.com</span></a>
					<span class="url-part separator-part">:</span>
					<a href="#port"><span class="url-part port-part">443</span></a>
					<span class="url-part separator-part">/</span>
					<a href="#path"><span class="url-part path-part">path/to/resource</span></a>
					<span class="url-part separator-part">?</span>
					<a href="#parameters"><span class="url-part query-part">query=parameters</span></a>
					<span class="url-part separator-part">#</span>
					<a href="#fragment"><span class="url-part fragment-part">fragment</span></a>
				</span>
			</div>
		</div>

		<div class="content-block">
			<h3 id="protocol">Protocol</h3>
			<p>
				The first part of a URL is the protocol or scheme, which indicates how the browser should
				communicate with the server. The scheme is essential as it determines the method of
				communication between the browser and the server, ensuring the correct type of data
				transfer.
			</p>
			<p>Some common schemes include:</p>
			<ul>
				<li><b>http</b> - for unsecured connections</li>
				<li><b>https</b> - for secure connections, which use SSL/TLS encryption</li>
				<li><b>ftp</b> - for file transfers</li>
			</ul>
		</div>

		<div class="content-block">
			<h3 id="host">Host</h3>
			<p>
				The host is a crucial part of the URL that identifies the specific server where the website
				or resource is located. The host can be an IP address, such as <i><b>192.168.1.1</b></i>, or
				more commonly, a domain name like <i><b>example.com</b></i>. The host is responsible for
				directing the request to the correct server, where the desired resources are stored. Without
				the host, the browser wouldn't know where to send the request, making it impossible to
				retrieve the content. The host serves as the bridge between the user’s request and the
				server that fulfills it.
			</p>
		</div>

		<div class="content-block">
			<h3 id="port">Port</h3>
			<p>
				In some cases, a port number is specified in a URL, although it is usually hidden. The port
				number, like <i><b>443</b></i> in <b><i>https://example.com:443</i></b>, tells the server
				which service is being requested. Common ports include 80 for HTTP and 443 for HTTPS. If the
				default port is used, it’s typically omitted from the URL, making it less visible to the
				average user. The port is a behind-the-scenes element that ensures the correct service is
				accessed when a URL is entered.
			</p>
		</div>

		<div class="content-block">
			<h3 id="path">Path</h3>
			<p>
				The path comes after the domain and directs the browser to a specific resource on the
				server, such as a webpage, image, or document. The path corresponds to a directory or file
				structure on the server and is often represented by a forward slash followed by a series of
				words, like <i><b>/about-us</b></i>. Paths are case-sensitive and can include multiple
				segments, such as <i><b>/blog/2024/08/article</b></i>, guiding the user to a particular page
				within the site.
			</p>
		</div>

		<div class="content-block">
			<h3 id="parameters">Parameters</h3>
			<p>
				Sometimes, URLs include a parameters string, which provides additional parameters to the
				server. The query string typically follows a question mark <b><i>(?)</i></b> and consists of
				key-value pairs separated by ampersands <b><i>(&)</i></b>.
			</p>
			<p>
				For example, in <b><i>?search=URL+structure</i></b>, the query string is used to pass data
				like search parameters, filter settings, or tracking information to the server. This part of
				the URL allows dynamic content generation and customized responses from the server based on
				user input.
			</p>
		</div>

		<div class="content-block">
			<h3 id="fragment">Fragment</h3>
			<p>
				Finally, the fragment or anchor is used to identify a specific part of a webpage, such as a
				section, heading, or anchor point. The fragment is preceded by a hash symbol <b
					><i>(#)</i></b
				> and directs the browser to jump to a specific location on the page.
			</p>
			<p>
				For example, <b>#section2</b> might take the user directly to the second section of a lengthy
				article. Fragments are particularly useful for navigating long pages or linking to specific content
				without reloading the entire page.
			</p>
		</div>
	</div>
</div>

<style>
	@media (max-width: 1000px) {
		.title {
			font-size: 2rem;
		}
	}

	h2 {
		font-size: 1.5rem;
		color: var(--on-background-color);
	}

	h3 {
		font-size: 1.2rem;
		color: var(--on-background-color);
	}

	li,
	p {
		color: var(--on-background-color);
		-moz-osx-font-smoothing: grayscale;
		-webkit-font-smoothing: antialiased !important;
		-moz-font-smoothing: antialiased !important;
		text-rendering: optimizelegibility !important;
		letter-spacing: 0.03em;
		line-height: 1.4;
	}

	a {
		color: var(--on-background-color);
		text-decoration: none;
	}

	.content-container {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
	}

	.content-block {
		margin-bottom: 24px;
	}

	.url-parts {
		font-size: 0.9rem;
		line-height: 2;
	}

	.url-part {
		padding: 4px;
	}

	.scheme-part {
		background-color: #ff715b;
	}

	.separator-part {
		background-color: #bced09;
	}

	.host-part {
		background-color: #dba159;
	}

	.port-part {
		background-color: #e396df;
	}

	.path-part {
		background-color: #cc76a1;
	}

	.query-part {
		background-color: #6a7fdb;
	}

	.fragment-part {
		background-color: #ca895f;
	}
</style>
