<script>
	import Articles from "./Articles.svelte";
	import Sources from "./HeaderComponent/Sources.svelte";
	import Date from "./HeaderComponent/Date.svelte";
	import Info from "./HeaderComponent/Info.svelte";
	import Other from "./HeaderComponent/Other.svelte";
	import Arrow from "./arrow.svelte";
	import { onMount } from "svelte";
	import { NewsApiLoader, SearchUrl, sourceLoad, MakeArticlesList } from "./helper.js";

	let url_everything = 'https://newsapi.org/v2/everything?pageSize=96&';
	let url_headline = 'https://newsapi.org/v2/top-headlines?';
	let url_keyword = (keywords) => {
		let temp = keywords.reduce((url, keyword) => {
			return `${url}${keyword}+`
		}, "q=");
		return temp.slice(0,-1) + "&";
	};
	let url_source = (sources) => { 
		let temp = sources.reduce((source, key) => {
			return `${source}${key},`
		}, "sources=");
		return temp.slice(0,-1) + "&";
	};
	// let url_pageSize = (size) => { return `pageSize=${size}&` };
	let url_language = (language) => { return `language=${language}&` };
	let url_date_from = (from) => { return `from=${from}&` };
	let url_date_to = (to) => { return `to=${to}&` };
	let url_sortBy = (what) => { return `sortBy=${what}&` };
	let apiKey = 'apiKey=5ccb5225a99744a3960174e417badf08';

	const default_url = url_headline + "country=us&" + apiKey;
	let url;
	let articles;
	let articles_list;
	let num = 12;


	let searchInfo = {
		keyword: false,
		source: false,
		// pageSize: "96",
		language: false,
		date_from: false,
		date_to: false,
		sortBy: false
	}

	function setUrl() {
		//change url according to searchInfo
		let keyword = searchInfo.keyword ? url_keyword(searchInfo.keyword) : "";
		let source = searchInfo.source ? url_source(searchInfo.source) : "";
		// let pageSize = searchInfo.pageSize ? url_pageSize(searchInfo.pageSize) : "";
		let language = searchInfo.language ? url_language(searchInfo.language) : "";
		let date_from = searchInfo.date_from ? url_date_from(searchInfo.date_from) : "";
		let date_to = searchInfo.date_to ? url_date_to(searchInfo.date_to) : "";
		let sortBy = searchInfo.sortBy ? url_sortBy(searchInfo.sortBy) : "";
		let url_tail = keyword + source + language + date_from + date_to + sortBy;
		url = url_tail == "" ? default_url : url_everything + url_tail + apiKey;
		if(keyword=="" && source=="") {
			alert("Sorry, Keyword or Source is required...");
			return;
		}
		articles = false;
		isUrlChanged = true;
		console.log(url)
	}
	//set button
	function set() {
		setSource();
		setKeyword();
		setDate();
		setOthers();
		setUrl();
	}
	//Search by Keywords
	let inputText;
	function setKeyword(event) {
		if(inputText=="" || inputText==undefined) {
			searchInfo["keyword"] = false;
		} else {
			let keywords = inputText.split(" ");
			searchInfo["keyword"] = keywords;
		}
		if(!event) return;
		if (event.key == "Enter") set();
	}
	//Source
	function setSource() {
		let selected = sources
						.filter(source => source.checked)
						.map(source => source.source);
		searchInfo["source"] = (selected.length == 0 ? false : selected);
	}
	//Date
	let fromDate = false;
	let toDate = false;
	function setDate() {
		if(fromDate) searchInfo["date_from"] = fromDate.length == 0 ? false : fromDate;
		if(toDate) searchInfo["date_to"] = toDate.length == 0 ? false : toDate;
	}
	//Other
	let sortTypeIndex = 0;
	let sortType;
	let languageIndex = 0;
	let language = "All";
	function setOthers() {
		searchInfo["sortBy"] = sortType == "" ? false : sortType;
		searchInfo["language"] = language == "All" ? false : language;
	}

	//Update articles when url is changed.
	let isUrlChanged = false;
	$: if (isUrlChanged) {
		updateArticles(url);
		isUrlChanged = true;
	}
	function updateArticles(url) {
		NewsApiLoader(url)
				.then(data => {
					articles = data;
					articles_list = MakeArticlesList(articles, num);
				})
	}



	//change display articles
	function turnRight() {
		articles_list = turnPage(articles_list, "r")
	}
	function turnLeft() {
		articles_list = turnPage(articles_list, "l");
	}
	function turnPage(list, RightOrLeft) {
		let turn = (RightOrLeft=="r" ? 1 : -1);
		for(let i=0;i<list.length;i++) {
			if(list[i].isActive) {
				list[i].isActive = false;
				list[i+turn].isActive = true;
				break;
			}
		}
		return list
	}
	

	//Clear function
	function clearSources() {
        sources.forEach(source => {
            source.checked = false;
		});
		searchInfo["source"] = false;
		sources = sources; //update and svelte reload...
		// url = default_url;
		// isUrlChanged = true;
	}
	function clearDate() {
		toDate = false;
		fromDate = false;
		searchInfo["date_from"] = false;
		searchInfo["date_to"] = false;
	}
	function clearOthers() {
		sortTypeIndex = 0;
		sortType = false;
		searchInfo["sortBy"] = false;
		language = "All";
		languageIndex = 0;
		searchInfo["language"] = false;
	}

	//category treatment
	let categoryItems = [
		{type: "source", isActive: false},
		{type: "date", isActive: false},
		{type: "others", isActive: false},
		{type: "info", isActive: false}
	];
	function toggleActiveItem() {
		categoryItems.forEach(el => {
			el.isActive = (el.type==this.id ? (el.isActive == true ? false: true) : false);
		})
		categoryItems = categoryItems;
	}
	function exitCategory() {
		categoryItems.forEach(el => {
			el.isActive = false;
		})
		categoryItems = categoryItems;
	}

	let sources;
	function start() {
		url = default_url;
		onMount( async() => {
			isUrlChanged = true;
			sources = await sourceLoad();
		})
	}
	start();
</script>


<main>
	<header>
		<input bind:value={inputText} on:keydown={setKeyword} type="search" placeholder="Keywords" id="search__input">
		<div class="category">
			{#each categoryItems as item }
				<div class="category__item" on:click={toggleActiveItem} class:category__item__active={item.isActive} id={item.type}>{item.type}</div>
			{/each}
		</div>
	</header>

	{#if articles_list}
		<Arrow on:turnRight={turnRight} on:turnLeft={turnLeft} isActive={articles_list.map(list => list.isActive)}/>
	{/if}
	
	{#if categoryItems[0].isActive }
		<Sources {sources} on:set={set} on:clear={clearSources} on:close={exitCategory} />
	{:else if categoryItems[1].isActive }
		<Date bind:fromDate={fromDate} bind:toDate={toDate} on:set={set} on:clear={clearDate} on:close={exitCategory} />
	{:else if categoryItems[2].isActive }
		<Other bind:sortType={sortType} bind:i={sortTypeIndex} bind:language={language} bind:l={languageIndex} on:close={exitCategory} on:set={set} on:clear={clearOthers} />
	{:else if categoryItems[3].isActive }
		<Info {searchInfo} on:close={exitCategory} />
	{/if}

	{#if articles }
		{#if articles.length == 0}<p>No Result</p>{/if}
		{#each articles_list as a_list }
			{#if a_list.isActive }
				<Articles articles={a_list.articles} />
			{/if}
		{/each}
	{:else }
		<p>Now Loading...</p>
	{/if}

	<footer>
		<div id="link__newsapi">Powered by <a href="https://newsapi.org/">News API</a></div>
	</footer>
</main>


<style>
	@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
	@import url('https://fonts.googleapis.com/css2?family=Alata&display=swap');
	:global(body){
		margin: 0;
		padding: 0;
		padding-top: 3rem;
		background: var(--ft-color1);
	}
	:global(.container) {
		width: 90%;
		margin: auto;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		min-height: 90vh;
	}
	:global(a) {
		text-decoration: none;
        color: black;
	}
	:global(a:hover) {
		text-decoration: none;
	}
	:global(:root) {
		--test-border1 : solid 1px red;
		--test-border2 : solid 2px green;
		--click-border: solid 3px rgba(0,0,0,0.3);
		--ft-color1: #fff1e5;
		--ft-color2: #f2dfce;
		--ft-color3: #262a33;
		--ft-color4: #807973;
		--ft-color5: #95284d;
		/* --ft-color1: #000;
		--ft-color2: #000; */
	}
	:global(.header_open) {
        position: fixed;
        top: 2.5rem;
		min-height: 30vh;
        max-height: 90vh;
        margin-bottom: 1rem;
        background: var(--ft-color3);
        overflow: auto;
        width: 100%;
        opacity: 0.97;
		z-index: 10;
    }
	header {
		top: 0;
		left: 0;
		position: fixed;
		width: 100%;
		height: 2.5rem;
		/* border: var(--test-border1); */
		background: var(--ft-color2);
		opacity: 0.99;
		display: flex;
		align-items: center;
		z-index: 10;
	}
	.category {
		/* position: relative; */
		font-family: 'Alata', sans-serif;
		/* border: var(--test-border1); */
		width: 100%;
		height: 2.5rem;
		display: flex;
	}
	.category__item {
		color: black;
		/* margin-right: 1rem; */
		/* border: var(--test-border2); */
		width: 80px;
		text-align: center;
		padding: 10px 0;
	}
	.category__item:hover {
		background: var(--ft-color4);
	}
	.category__item__active {
		background: var(--ft-color4);
	}
	#search__input {
		margin: 0;
		margin-right: 20px;
		background: var(--ft-color1);
		border: none;
		/* border-radius: 10px 10px 10px 10px; */
	}
	#search__input:focus {
		background: #ccc1b7;
		border: solid 1.5px rgba(38,42,51,0.5);
		outline: none;
	}
	footer {
		height: 100px;
		width: 100%;
		background: #262a33;
	}
	#link__newsapi {
		color: white;
	}
	#link_newsapi a {
		color: inherit;
		text-decoration: none;
	}



</style>