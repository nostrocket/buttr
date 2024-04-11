<script lang="ts">
  import { writable } from "svelte/store";
  import { ResponseData, Command } from "./worker.types";
  import { npubToHex } from "./helpers";
  import Recursve from "./Recursve.svelte";

  const responseFromWorker = writable(new ResponseData());
  let myWorker: Worker | undefined = undefined;

  const onWorkerMessage = (x:MessageEvent<ResponseData>) => {
    responseFromWorker.update((current) => {
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

  let rootPubkey = "d91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075"
</script>

<button on:click={setup}>Start Web Worker</button>
{#if myWorker}
<button disabled={$responseFromWorker.connected != 0}
on:click={() => {
  myWorker?.postMessage(connect);
}}>{#if $responseFromWorker.connected == 0}ndk.connect{:else if $responseFromWorker.connected == 1 }connecting {:else}connected{/if}</button
>
<br />pubkey:<input bind:value={rootPubkey} size={72} maxlength={64}>
  <button
    on:click={() => {
      try {
        rootPubkey = npubToHex(rootPubkey)
      } catch {
        alert("invalid pubkey"); 
        return
      }
      myWorker?.postMessage(new Command("start", rootPubkey));
    }}>ndk.storeSubscribe</button
  ><br />
  <button
    on:click={() => {
      myWorker?.postMessage({ command: "stop" });
    }}>sub.unsubscribe </button
  >
  <button
  on:click={() => {
    myWorker?.postMessage({ command: "print" });
  }}>print </button
>
  <button
  on:click={() => {
    myWorker?.terminate();
    myWorker = undefined;
  }}>Exterminate Web Worker</button
>
{/if}
<br />
{#if $responseFromWorker.connected == 2}Relays are connected{:else if $responseFromWorker.connected == 1}Trying to connect to relays{:else}Not connected to any relays{/if}
<h4>Total events from all relays: {$responseFromWorker.rawCount}</h4>
<h4>UNIQUE EVENTS: {$responseFromWorker.events.size}</h4>

<h4>ROOT EVENT COUNT: {$responseFromWorker.rootEvents.size}</h4>

<h4>ROOT EVENTS WITH MENTIONS</h4>
{#each $responseFromWorker.rootEvents as id, i (id)}{/each}


<h4>RELAY CONNECTIONS</h4>
{#each $responseFromWorker.connections as [relay, subs], i (relay)}<h6>{relay} {subs}</h6> {/each}

<h4>EVENT KINDS</h4>
{#each $responseFromWorker.kinds as [kind, count]}KIND {kind}: {count}<br />{/each}

<h4>ERRORS</h4>
{#each $responseFromWorker.errors as err}{err}<br />{/each}

<h4>recursive</h4>
<Recursve data={$responseFromWorker.recursiveEvents} />
