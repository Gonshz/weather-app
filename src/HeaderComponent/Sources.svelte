<script>
    import Button from "./Button.svelte";
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    const set = () => dispatch('set');
    const clear = () => dispatch('clear');
    const close = () => dispatch('close');
    export let sources;
</script>

<div class="header_open">
    <Button on:set={set} on:clear={clear} on:close={close} />
    <div class="container">
        {#each sources as source}
            <div class="item" class:checked={source.checked} >
                <input type=checkbox bind:checked={source.checked} id={source.name}>
                <label for={source.name}>{source.name}</label>
            </div>
        {/each}
    </div>
</div>

<style>
    .container {
        width: 100%;
        max-height: 40rem;
        justify-content: start;
        flex-direction: column;
        color: white;
    }
    .item {
        display: flex;
        align-items: center;
    }
    input {
        margin: 0;
    }
    .checked {
        font-weight: 600;
        color: var(--ft-color5);
    }
</style>