import type { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";
import NDKSvelte, {
  type ExtendedBaseType,
  type NDKEventStore,
} from "@nostr-dev-kit/ndk-svelte";
import { get, writable } from "svelte/store";
import { EventTreeItem, ResponseData, type Command, type RecursiveEventMap } from "./worker.types";
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";

const _ndk = writable(
  new NDKSvelte({
    //cacheAdapter: new NDKCacheAdapterDexie({ dbName: "wiki" }),
    explicitRelayUrls: [
      "wss://purplepag.es",
      "wss://relay.nostr.band",
      "wss://nos.lol",
      "wss://relay.wikifreedia.xyz",
      "wss://relay.nostrocket.org",
      "wss://search.nos.today",
      "wss://relay.damus.io",
      "wss://relay.nostr.bg",
      "wss://relay.snort.social",
      "wss://offchain.pub",
      "wss://relay.primal.net",
      "wss://pyramid.fiatjaf.com",
    ],
    enableOutboxModel: true,
  })
);

const ndk = get(_ndk);
let sub: NDKEventStore<ExtendedBaseType<NDKEvent>> | undefined = undefined;

const responseData = new ResponseData();
const workerEventMap = new Map<string, NDKEvent>();
const mostRecentReplaceableEvents: Map<string, NDKEvent> = new Map();
const replaceableKinds = [0, 3];
const processedIdForKind: Record<number, string> = {};

let responseStore = writable(responseData);
responseStore.subscribe((response) => {
  postMessage(response);
});

let start = (pubkey: string) => {
  if (!get(responseStore).connected) {
    responseStore.update((current) => {
      current.errors.push(new Error("not connected!"));
      return current;
    });
    return;
  }
  if (!sub) {
    sub = ndk.storeSubscribe(
      { kinds: [0, 1, 3, 7], authors: [pubkey] },
      { subId: "34545" }
    );
    sub.subscribe((x) => {
      for (let y of x) {
        if (!workerEventMap.has(y.id)) {
          workerEventMap.set(y.id, y);
        }
        let shouldPush = true;
        if (replaceableKinds.includes(y.kind!)) {
          let existing = mostRecentReplaceableEvents.get(y.deduplicationKey());
          if (existing && y.created_at! < existing.created_at!) {
            shouldPush = false;
          } else {
            mostRecentReplaceableEvents.set(y.deduplicationKey(), y);
          }
        }
        if (shouldPush) {
          responseData.PushEvent(y.rawEvent());
        }
      }
      responseStore.update((current) => {
        current.rawCount = x.length;
        if (sub?.subscription) {
          for (let [s, relay] of sub.subscription.pool.relays) {
            current.connections.set(s, relay.activeSubscriptions().size);
          }
        } else {
          current.connections = new Map();
        }
        return current;
      });
    });
  } else {
    let newFilters: NDKFilter[] = [];
    if (sub.filters) {
      newFilters.push(...sub.filters);
    }
    newFilters.push({kinds:[0, 1, 3, 7], authors: [pubkey] });
    sub.changeFilters(newFilters);
    console.log(sub.filters);
    sub.unsubscribe();
    sub.startSubscription();
  }
};

onmessage = (m: MessageEvent<Command>) => {
  if (m.data.command == "connect") {
    if (get(responseStore).connected == 0) {
      responseStore.update((current) => {
        current.connected = 1;
        return current;
      });
      ndk.connect(5000).then(() => {
        responseStore.update((current) => {
          current.connected = 2;
          return current;
        });
      });
    } else {
      responseStore.update((current) => {
        current.errors.push(Error("already connected!"));
        return current;
      });
    }
  }

  if (m.data.command == "start") {
    if (m.data.pubkey) {
      start(m.data.pubkey);
    }
  }
  if (m.data.command == "stop") {
    if (sub) {
      sub.unsubscribe();
    }
  }

  if (m.data.command == "print") {
    updateEventMap()
  }
};



function updateEventMap() {
let m:RecursiveEventMap = new Map();
    for (let id of responseData.rootEvents) {
      m.set(id, new EventTreeItem(workerEventMap.get(id)!.rawEvent()));
    }
    m = iterate(m)
    for(let [_, evt] of m) {
        if (evt.children.size > 0) {
            for (let [_, evti] of evt.children) {
                if (evti.children.size > 0) {
                    console.log(evt)
                }
            }
        }
    }
}



function iterate(
    m: Map<string, EventTreeItem>,
  ): Map<string, EventTreeItem> {
    for (let [id, treeItem] of m) {
      let children:Map<string, EventTreeItem> = new Map()
      let _children = responseData.etags.get(treeItem.event.id!)
      if (_children) {
        for (let eventID of _children) {
          let _child_event = responseData.events.get(eventID)
          if (_child_event) {
            children.set(eventID, new EventTreeItem(_child_event))
          }
        }
      }
      treeItem.children = iterate(children)
      m.set(id, treeItem)
    }
    return m
  }