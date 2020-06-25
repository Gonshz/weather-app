<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    const set = () => dispatch('set');
    const clear = () => dispatch('clear');
    const close = () => dispatch('close');
</script>

<div class="button">
    <button on:click={set}>SET</button>
    <button on:click={clear}>CLEAR</button>
    <button on:click={close}>EXIT</button>
</div>

<style>
    .button {
        margin: 10px 0;
        width: 100%;
        /* background: var(--ft-color5); */
        align-items: center;
    }
    button {
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