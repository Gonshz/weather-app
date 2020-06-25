<script>
    import Button from "./Button.svelte";
    import { createEventDispatcher } from 'svelte';

    export let fromDate;
    export let toDate;

    const dispatch = createEventDispatcher();
    const set = () => dispatch('set');
    const clear = () => dispatch('clear');
    const close = () => dispatch('close');

    let date = new Date();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let minDay;
    let minMonth;
    if(day > 28) {
        minDay = 1;
        minMonth = month;
    } else {
        minDay = day + 1;
        minMonth = (month == 1) ? 12 : month -1;
    }
    
    if(month <= 10) month = "0" + month.toString();
    if(day < 10) day = "0" + day.toString();
    if(minMonth <= 10) minMonth = "0" + minMonth.toString();
    if(minDay < 10) minDay = "0" + minDay.toString();
    let today = `${date.getFullYear()}-${month}-${day}`;
    let minday = `${date.getFullYear()}-${minMonth}-${minDay}`;
    //need error log...when from date go over to date...
    $: varFrom = fromDate ? fromDate : minday;
    $: varTo = toDate ? toDate : today; 

    function minChanged() { fromDate = varFrom }
    function maxChanged() { toDate = varTo }

    </script>


<div class="header_open">
    <Button on:set={set} on:clear={clear} on:close={close} />
    <div class="calendar">
        <div class="date">
            <div>from</div>
            <input type="date" name="party" min={minday} max={varTo} bind:value={varFrom} class:changed={fromDate} on:change={minChanged}>
        </div>
        <div class="date">
            <div>to</div>
            <input type="date" name="party" min={varFrom} max={today} bind:value={varTo} class:changed={toDate} on:change={maxChanged}>
        </div>
    </div>
</div>

<style>
    .changed {
        border: solid 3px rgba(0,0,255,0.8);
    }
    .calendar {
        width: 90%;
        margin: auto;
        display: flex;
        flex-direction: column;
    }
    .date {
        display: flex;
        color: white;
        align-items: center;
    }
    .date div {
        width: 50px;
    }
    input {
        width: 200px;
        border: solid 3px inherit;
    }
</style>