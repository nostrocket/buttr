<script lang="ts">
  import { writable } from "svelte/store";
  import { ResponseData, type Command } from "./worker.types";

  const numberOfEvents = writable(new ResponseData());
  let myWorker: Worker | undefined = undefined;

  const onWorkerMessage = (x:MessageEvent<ResponseData>) => {
    numberOfEvents.update((current) => {
      current = x.data;
      return current;
    });
  };

  let setup = async () => {
    const w = await import("./worker.ts?worker");

    myWorker = new w.default();

    myWorker.onmessage = onWorkerMessage;
  };

  let start: Command = {
    command: "start",
    pubkey: "d91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075",
  };

  let connect: Command = {
    command: "connect",
  };
</script>

<button on:click={setup}>Start Web Worker</button>
{#if myWorker}
<button disabled={$numberOfEvents.connected != 0}
on:click={() => {
  myWorker?.postMessage(connect);
}}>{#if $numberOfEvents.connected == 0}ndk.connect{:else if $numberOfEvents.connected == 1 }connecting {:else}connected{/if}</button
>
  <button
    on:click={() => {
      myWorker?.postMessage(start);
    }}>ndk.storeSubscribe</button
  >
  <button
    on:click={() => {
      myWorker?.postMessage({ command: "stop" });
    }}>sub.unsubscribe </button
  >
  <button
  on:click={() => {
    myWorker?.terminate();
    myWorker = undefined;
  }}>Exterminate Web Worker</button
>
{/if}
<br />
{#if $numberOfEvents.connected == 2}Relays are connected{:else if $numberOfEvents.connected == 1}Trying to connect to relays{:else}Not connected to any relays{/if}
<h4>UNIQUE EVENTS: {$numberOfEvents.count}</h4>

<h4>RELAY CONNECTIONS</h4>
{#each $numberOfEvents.connections as [relay, subs], i (relay)}<h6>{relay} {subs}</h6> {/each}

<h4>ERRORS</h4>
{#each $numberOfEvents.errors as err}{err}<br />{/each}
