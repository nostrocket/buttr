<script lang="ts">
  import type { RecursiveEventMap } from "./worker.types";

    export let data:RecursiveEventMap;
</script>

{#each data as [_, tree]}
<p style="padding-left: 30px;">{tree.event.content}<br /><br />
{#if tree.children.size > 0}
<svelte:self data={tree.children} />
{/if}
</p>
{/each}