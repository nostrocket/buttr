<script lang="ts">
  import { writable, type Writable } from "svelte/store";
  import { ResponseData, Command } from "./worker.types";
  import { npubToHex } from "./helpers";
  import Recursve from "./Recursve.svelte";
  import { onMount } from "svelte";

  let responseFromWorker: Writable<ResponseData> | undefined; // = writable(new ResponseData());
  let myWorker: Worker | undefined = undefined;

  const onWorkerMessage = (x: MessageEvent<ResponseData>) => {
    if (!responseFromWorker) {
      responseFromWorker = writable(x.data);
    }
    responseFromWorker.update((current) => {
      current = x.data;
      return current;
    });
  };
  let WorkerStarted = false;

  let setup = async () => {
    if (!WorkerStarted) {
      WorkerStarted = true;
      const w = await import("./worker.ts?worker");
      myWorker = new w.default();
      myWorker.onmessage = onWorkerMessage;
      myWorker.postMessage(connect);
    }
  };
 
  let start: Command = {
    command: "start",
    pubkey: "d91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075",
  };

  let connect: Command = {
    command: "connect",
  };

  let rootPubkey =
    "d91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075";

  onMount(() => {
    setup();
  });
</script>
{#if myWorker}
  pubkey:<input bind:value={rootPubkey} size={72} maxlength={64} />
  <button
    on:click={() => {
      try {
        rootPubkey = npubToHex(rootPubkey);
      } catch {
        alert("invalid pubkey");
        return;
      }
      myWorker?.postMessage(new Command("start", rootPubkey));
    }}>ndk.storeSubscribe</button
  ><br />
  <button
    on:click={() => {
      myWorker?.postMessage({ command: "stop" });
    }}
    >sub.unsubscribe
  </button>
  <button
    on:click={() => {
      myWorker?.postMessage({ command: "print" });
    }}
    >print
  </button>
  <button
    on:click={() => {
      myWorker?.terminate();
      myWorker = undefined;
    }}>Exterminate Web Worker</button
  >
{/if}
<br />
{#if responseFromWorker && $responseFromWorker}
  <h4>UNIQUE EVENTS: {$responseFromWorker.events.size}</h4>

  <h4>ROOT EVENT COUNT: {$responseFromWorker.rootEvents.size}</h4>

  <h4>RELAY CONNECTIONS</h4>
  {#each $responseFromWorker.connections as [relay, subs], i (relay)}<h6>
      {relay}
      {subs}
    </h6>
  {/each}

  <h4>EVENT KINDS</h4>
  {#each $responseFromWorker.kinds as [kind, count]}KIND {kind}: {count}<br
    />{/each}

<h4>MASTER PUBKEY: {$responseFromWorker.masterPubkey}: {$responseFromWorker.followLists.get($responseFromWorker.masterPubkey)?.size}</h4>

<h4>MASTER PUBKEY FOLLOW LIST LENGTHS</h4>
<!-- {#each $responseFromWorker.followLists as [pubkey, set], i (pubkey)}<p>
  {#if pubkey == $responseFromWorker.masterPubkey} {pubkey}: {set.size}{/if}
  </p>{/each} -->

  <h4>ALL FOLLOW LIST LENGTHS</h4>
  {#each $responseFromWorker.followLists as [pubkey, set], i (pubkey)}<p>
      {pubkey}: {set.size}
    </p>{/each}

  <h4>ERRORS</h4>
  {#each $responseFromWorker.errors as err}{err}<br />{/each}

  <!-- <h4>recursive</h4>
  <Recursve data={$responseFromWorker.recursiveEvents} /> -->
{/if}
