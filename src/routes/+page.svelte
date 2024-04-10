<script lang="ts">
  import { writable } from 'svelte/store';
  import { Response, type Command } from './worker';



const numberOfEvents = writable(new Response())
let myWorker: Worker;

const onWorkerMessage = (x:MessageEvent<Response>) => {
    numberOfEvents.update(current=>{
    current = x.data
    return current
  })
  
  //console.log(8, x.data)
      //console.log('Cool it works out 😃');
  };

let setup = async () =>{
  const w = await import('./worker.ts?worker')

 myWorker = new w.default();
 
 myWorker.onmessage = onWorkerMessage
}

let start:Command = {command:"start", pubkey: "d91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075"}


</script>
<button on:click={setup}>setup worker</button>
{#if myWorker}
<button on:click={()=>{myWorker.postMessage(start)}}>Subscribe</button>
<button on:click={()=>{myWorker.postMessage({command:"print"})}}>Print</button>
<button on:click={()=>{myWorker.postMessage({command:"stop"})}}>Stop</button>
{/if}
<br />
EVENTS: {$numberOfEvents.count}
<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
