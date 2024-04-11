<script lang="ts">
  import type { RecursiveEventMap } from "./worker.types";

    export let data:RecursiveEventMap;
</script>

{#each data as [_, tree]}
{#if tree.children.size > 0}
<p style="padding-left: 30px;">{tree.event.content}<br /><br />
<svelte:self data={tree.children} />
</p>
{/if}
{/each}