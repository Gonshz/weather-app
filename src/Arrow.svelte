<script>
	import { createEventDispatcher } from 'svelte';
	export let isActive;
	const dispatch = createEventDispatcher();
	const turnRight = () => dispatch('turnRight');
	const turnLeft = () => dispatch('turnLeft');
</script>

<div>
	<div id="leftpage" on:click={turnLeft} class:inactive={isActive[0]}></div>
	<div id="rightpage" on:click={turnRight} class:inactive={isActive[isActive.length-1]}></div>
	<div id="left"  class:inactive={isActive[0]}><div class="arrow"></div></div>
    <div id="right" class:inactive={isActive[isActive.length-1]}><div class="arrow"></div></div>
</div>

<style>
	.inactive {
		display: none;
	}
    #right, #left {
		top: 45vh;
		position: fixed;
		height: 25px;
		width: 25px;
	}
	#leftpage, #rightpage {
		height: 250px;
		width: 70px;
		position: fixed;
		top: 45vh;
		transform: translateY(-45%);
		z-index: 10;
	}
	#rightpage:hover {
		opacity: 0.6;
		background-image: linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.7));
	}
	#leftpage:hover {
		opacity: 0.6;
		background-image: linear-gradient(to left, rgba(0,0,0,0.3), rgba(0,0,0,0.7));
	}
	#rightpage {
		right: 0;
	}
	#leftpage {
		left: 0;
	}
	.arrow {
		border-top: var(--click-border);
		border-left: var(--click-border);
		height: 100%;
		width: 100%;
	}
	#right .arrow {
		transform: rotate(-225deg);
	}
	#left .arrow {
		transform: rotate(-45deg);
	}
	#right {
		right: 0;
		transform: translateX(-1vw);
	}
	#left {
		left: 0;
		transform: translateX(1vw);
	}
</style>