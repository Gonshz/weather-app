<!-- Loader.svelte displays articles, loading them, and return as html object.-->
<!-- input: url -->
<script>
	export let articles;
	let num = 4;
	let onelineArticles = [];
	let tempContainer = [];
	let i = 1;
	articles.forEach(article => {
		tempContainer.push(article);
		if(i % num == 0){
			onelineArticles.push(tempContainer);
			tempContainer = [];
		}
		i += 1;
	})
	// console.log(onelineArticles)
	console.log(window)
	window.addEventListener("mousemove", () => {
		console.log(document.body.clientWidth)
	})

	//no idea how to decide the number of items..............
</script>


{#if articles[0] != 1 }
<main id="articles">
	{#each onelineArticles as articles}
	<div class="netflix__container">
		{#each articles as article}
		<article class="article__container" >
			<a href="{article.url}">
				<!-- <img class="article__image" src={article.urlToImage} width="200px" />  -->
				<div class="img">
					<img class="article__image" src={article.urlToImage} width="200px" />
					<div>
						<p class="article__description" >{article.description}</p>
					</div>
				</div>
				<h1 class="article__title">{article.title}</h1>
				<!-- <p class="article__description" >{article.description}</p> -->
				<p class="article__info">{article.source} - {article.publishedAt}</p>
			</a>
		</article>
		{/each}
	</div>
	{/each}
</main>
{/if}

<style>
	.img {
		text-align: center;
		position: relative;
	}
	.img > div {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 90%;
		transform: translate(-50%,-50%);
		z-index: 2;
		color: #fff;
		/* text-shadow: 3px 2px 2px rgba(0, 0, 0, 0.9); */
		text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
		/* background: rgba(0,0,0,0.5); */
		font-size: 13px;
	}
	.img:hover, img:focus {
		filter: grayscale(0.8);
	}
    :root {
        --article-width: 200px;
        --image-width: 100%;
    }
	#articles {
        background: var(--ft-color1);
		width: 95%;
		margin: auto;
		min-height: 90vh;
	}
	/* add below */
	.netflix__container {
		display: flex;
		/* flex-wrap: wrap; */
		/* margin: auto; */
		/* justify-content: start; */
		/* margin-bottom: 70px; */
	}
    .article__container {
		margin: 5px 5px;
		display: block;
		flex: 1 1 var(--article-width);
		transition: transform 0.5s;
		margin-bottom: 30px;
    }
	.netflix__container:focus-within .article__container, 
	.netflix__container:hover .article__container {
		transform: translateX(-5%);
	}
	.article__container:focus ~ .article__container, 
	.article__container:hover:hover ~ .article__container {
		transform: translateX(5%);
	}
	.article__container:focus, .article__container:hover {
		/* transform: scale(1.2); */
		/* transform: translateX(-25%) translateY(-25%); */
		z-index: 1;
	}
	.article__container:focus a, .article__container:hover a {
		transform: scale(1.1);
		transform-origin: center;
		z-index: 1;
	}
	.article__container:focus .article__description, 
	.article__container:hover .article__description,
	.article__container:hover .article__info,
	.article__container:focus .article__info {
		display: block;
	}
	a {
		display: block;
		/* margin: 0 0 1em 0; */
        text-decoration: none;
        color: black;
		position: relative;
		transition: transform 0.5s;
	}
    .article__image {
        width: var(--image-width);
        max-height: 150px;
        object-fit: cover;
    }
	.article__title {
		font-size: 15px;
        /* font-weight: 600; */
        font-family: 'Playfair Display', serif;
		margin: 3px 0;
	}
    .article__description {
        /* font-size: 12px;
        color: rgba(0,0,0,0.8);
        font-weight: 450;
		margin: 0; */
		display: none;
    }
	.appear {
		display: block;
	}
    .article__info {
		margin: 3px;
        font-size: 10px;
		font-weight: 600;
        color: rgba(0,0,0,0.5);
		display: none;
    }
    @media screen and (max-width: 450px) {
        :root {
            --article-width: 100%;
        }
		.netflix__container {
			flex-wrap: wrap;
		}
    }
    @media screen and (max-width: 800px) and (min-width: 450px) {
        :root {
            --article-width: 45%;
            /* --image-width: 100%; */
        }
		.netflix__container {
			flex-wrap: wrap;
		}
    }
    @media screen and (min-width: 800px) and (max-width: 1100px) {
        :root {
            --article-width: 30%;
            /* --image-width: 100%; */
        }
    }
    @media screen and (min-width: 1100px) {
        :root {
            --article-width: 250px;
            /* --image-width: 100%; */
        }
    }

</style>


