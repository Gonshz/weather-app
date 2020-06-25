<script>
    import { createEventDispatcher } from 'svelte';

    export let searchInfo;
    console.log(searchInfo)

    const dispatch = createEventDispatcher();
    const close = () => dispatch('close');

    let info = [];
    for(let key in searchInfo) {
        if(!searchInfo[key]) {
            info.push([key, ""]);
        } else {
            info.push([key, searchInfo[key]]);
        };
    }
</script>

<div class="header_open">
    <div class="info_container">
        <button on:click={close}>EXIT</button>
        <div class="info">
            {#each info as i}
                <div>{i[0]} : {i[1]}</div>
            {/each}
        </div>
    </div>
</div>

<style>
    .info {
        color: white;
    }
    .info > div {
        margin-bottom: 15px;
    }
    .info_container {
        width: 90%;
        margin: auto;
    }
    button {
        margin: 10px 0;
        color: #fff;
        font-weight: 600;
        border: 2px solid #fff;
        width: 85px;
        cursor: pointer;
        background: var(--ft-color5);
        border-radius: 100px;
        transition: all .1s ease;
        margin-left: 10px;
    }
    button:hover {
        background: #c3265a;
    }
</style>