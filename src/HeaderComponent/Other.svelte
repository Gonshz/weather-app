<script>
    import Button from "./Button.svelte";
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    const set = () => dispatch('set');
    const clear = () => dispatch('clear');
    const close = () => dispatch('close');

    export let sortType;
    export let i;
    let sortByWhat = ["", "relevancy", "popularity", "publishedAt"];
    $: if(i) { sortType = sortByWhat[i] };

    export let language;
    export let l;
    $: if(l) { language = languageCode[l][1] };
    let languageCode = [
        ["All", ""],
        ["Arabic","ar"],
        ["German","de"],
        ["English","en"],
        ["Spanish","es"],
        ["French","fr"],
        ["Hebrew","he"],
        ["Italian","it"],
        ["Dutct","nl"],
        ["Norwegian","no"],
        ["Portuguese","pt"],
        ["Russian","ru"],
        ["Northern Sami","se"],
        ["Chinese","zh",]
    ]

</script>

<div class="header_open">
    <Button on:set={set} on:clear={clear} on:close={close} />
    <div class="other_container">
        <div class="item">
            <div>sort type:</div>
            <select bind:value={i}>
                {#each sortByWhat as type, i }
                <option value={i}>{type}</option>
                {/each}
            </select>
        </div>
        <div class="item">
            <div>language</div>
            <select bind:value={l}>
                {#each languageCode as code, l }
                <option value={l}>{code[0]}</option>
                {/each}
            </select>
        </div>
    </div>
</div>

<style>
    .other_container {
        width: 90%;
        margin: auto;
        color: white;
    }
    .item {
        display: flex;
        align-items: center;
    }
    .item > div {
        margin-right: 10px;
    }
</style>