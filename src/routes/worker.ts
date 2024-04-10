import type { NDKEvent } from "@nostr-dev-kit/ndk";
import NDKSvelte, {
  type ExtendedBaseType,
  type NDKEventStore,
} from "@nostr-dev-kit/ndk-svelte";
import { get, writable } from "svelte/store";
import { ResponseData, type Command } from "./worker.types";
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";

const _ndk = writable(
  new NDKSvelte({
    cacheAdapter: new NDKCacheAdapterDexie({ dbName: "wiki" }),
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

const set = new Set();
let responseStore = writable(new ResponseData());
responseStore.subscribe((response) => {
    postMessage(response);
  });

let connected = false;

let start = (pubkey: string) => {
if (!connected) {
    responseStore.update(current=>{
        current.errors.push(new Error("not connected!"))
        return current
    })
}
  sub = ndk.storeSubscribe({ authors: [pubkey] }, { subId: "kind-1" });
  sub.subscribe((x) => {
    for (let y of x) {
      if (!set.has(y.id)) {
        set.add(y.id);
      }
    }
    responseStore.update((current) => {
      current.count = set.size;
      return current;
    });
    if (sub) {
      responseStore.update((current) => {
        if (sub?.subscription) {
          for (let [s, relay] of sub.subscription.pool.relays) {
            current.connections.set(s, relay.activeSubscriptions().size);
          }
        } else {
          current.connections = new Map();
        }
        return current;
      });
    }
  });
};

onmessage = (m: MessageEvent<Command>) => {
  if (m.data.command == "connect") {
    if (get(responseStore).connected == 0) {
        responseStore.update(current=>{
            current.connected = 1;
            return current;
        })
        ndk.connect(5000).then(() => {
            responseStore.update(current=>{
                current.connected = 2;
                return current;
            })
        });
    } else {
        responseStore.update(current=>{
            current.errors.push(Error("already connected!"))
            return current
        })
    }
  }

  if (m.data.command == "start") {
    if (m.data.pubkey) {start(m.data.pubkey)}
  }
  if (m.data.command == "stop") {
    if (sub) {
      sub.unsubscribe();
    }
  }

  if (m.data.command == "print") {
    if (sub) {
      for (let [s, relay] of sub.subscription!.pool.relays) {
        console.log(s, relay.activeSubscriptions().size);
      }
    }
  }
};
