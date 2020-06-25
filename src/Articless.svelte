<!-- Loader.svelte displays articles, loading them, and return as html object.-->
<!-- input: url -->
<script>
	export let articles;
	import Item from "./Item.svelte";
	import { num_display_articles } from "./helper.js";
</script>


{#if articles[0] != 1 }
<main id="articles">
	<div class="container">
		{#each articles as article}
			<Item {article} />
		{/each}
	</div>
</main>
{/if}
	
<style>
    #articles {
        background: var(--ft-color1);
	}
</style>