import type { NDKEvent } from "@nostr-dev-kit/ndk";
import NDKSvelte, {
  type ExtendedBaseType,
  type NDKEventStore,
} from "@nostr-dev-kit/ndk-svelte";
import { get, writable } from "svelte/store";
import { ResponseData, type Command } from "./worker.types";

const _ndk = writable(
  new NDKSvelte({
    //cacheAdapter: new NDKCacheAdapterDexie({ dbName: 'wiki' }),
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

let start = (pubkey: string) => {
  console.log(pubkey);
  ndk.connect(5000).then(() => {
    sub = ndk.storeSubscribe({ authors: [pubkey] }, { subId: "kind-1" });
    let response = new ResponseData;
    sub.subscribe((x) => {
      for (let y of x) {
        if (!set.has(y.id)) {
          set.add(y.id);
        }
      }
      response.count = set.size;
      if (sub) {
        for (let [s, relay] of sub.subscription!.pool.relays) {
          response.connections.set(s, relay.activeSubscriptions().size);
        }
      }
      postMessage(response);
    });
  });
};

onmessage = (m: MessageEvent<Command>) => {
  //const { data } = event;
  if (m.data.command == "start") {
    start(m.data.pubkey);
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
  //const transformedData = doSomeHeavyWork(data);
};
