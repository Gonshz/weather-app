<!-- Item.svelte displays just an article -->
<!-- input: object has url, urlToImage, title, description, source, publishedAt, content, author. -->
<script>
    export let article;
</script>

<article class="article__container">
    <a href="{article.url}">
        <img class="article__image" src={article.urlToImage} width="200px" /> 
        <h1 class="article__title">{article.title}</h1>
        <p class="article__description">{article.description}</p>
        <p class="article__info">{article.source} - {article.publishedAt}</p>
    </a>
</article>


<style>
    :root {
        --article-width: 250px;
        --image-width: 100%;
    }
	article {
		margin: 5px 5px;
        flex:1 1 0px;
	}
	a {
		display: block;
        /* position: relative; */
        transition: transform 0.5s;
		margin: 0 0 1em 0;
        text-decoration: none;
        color: black;
	}
    .article__container {
        width: var(--article-width);
    }
    .article__image {
        width: var(--image-width);
        height: 120px;
        object-fit: cover;
    }
	.article__title {
		font-size: 14px;
        /* font-weight: 600; */
        font-family: 'Playfair Display', serif;
	}
    .article__description {
        font-size: 12px;
        color: rgba(0,0,0,0.8);
        font-weight: 450;
    }
    .article__info {
        font-size: 12px;
        color: rgba(0,0,0,0.5);
    }
    @media screen and (max-width: 450px) {
        :root {
            --article-width: 100%;
        }
    }
    @media screen and (max-width: 800px) and (min-width: 450px) {
        :root {
            --article-width: 45%;
            /* --image-width: 100%; */
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


