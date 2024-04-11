import { NDKEvent, type NostrEvent } from "@nostr-dev-kit/ndk";

export class Command {
  command: "start" | "stop" | "connect" | "print";
  pubkey?: string;
  constructor(
    command: "start" | "stop" | "connect" | "print",
    pubkey?: string
  ) {
    this.command = command;
    this.pubkey = pubkey ? pubkey : "";
  }
}

export class ResponseData {
  connected: number = 0;
  rawCount: number = 0;
  count(): number {
    return this.events.size;
  }
  connections: Map<string, number>;
  errors: Error[];
  events: Map<string, NostrEvent>;
  etags: Map<string, Set<string>>;
  kinds: Map<number, number>;
  rootEvents: Set<string>;
  recursiveEvents: RecursiveEventMap;
  directFollows: Set<string>;

  constructor() {
    this.recursiveEvents = new Map()
    this.etags = new Map();
    this.directFollows = new Set();
    this.connections = new Map();
    this.errors = [];
    this.events = new Map();
    this.kinds = new Map();
    this.rootEvents = new Set();
  }

  PushEvent(ev: NostrEvent): void {
    if (!this.events.has(ev.id!)) {
      this.events.set(ev.id!, ev);
      {
        let existing = this.kinds.get(ev.kind!);
        if (!existing) {
          existing = 0;
        }
        existing++;
        this.kinds.set(ev.kind!, existing);
      }

      if (ev.kind == 1 || ev.kind == 7) {
        let e = new NDKEvent(undefined, ev);
        let found = false;
        for (let t of e.getMatchingTags("e")) {
          if (t[1].length == 64 && !t.includes("root")) {
            let existing = this.etags.get(t[1]);
            if (!existing) {
              existing = new Set<string>();
            }
            existing.add(e.id);
            this.etags.set(t[1], existing);
          }

          if (!t.includes("mention")) {
            found = true;
          }
          // if (t.includes("mention")) {
          //   if (t[1].length == 64) {
          //     let _existing = this.rootEvents.get(t[1])
          //     if (!_existing) {_existing = new EventTreeItem(t[1])}
          //       _existing.mentions.set(e.id, new EventTreeItem(e.id, e.rawEvent()))
          //       this.rootEvents.set(t[1], _existing)
          //   }
          // }
          // if (t.includes("reply")) {
          //   if (t[1].length == 64) {
          //     let _existing = this.rootEvents.get(t[1])
          //     if (!_existing) {_existing = new EventTreeItem(t[1])}
          //       _existing.directReplies.set(e.id, new EventTreeItem(e.id, e.rawEvent()))
          //       this.rootEvents.set(t[1], _existing)
          //   }
          // }
        }
        if (!found) {
          this.rootEvents.add(ev.id!);
          // let existing = this.rootEvents.get(ev.id!);
          // if (!existing) {
          //   existing = new EventTreeItem(ev);
          // }
          // if (!existing.event) {
          //   existing.event = ev;
          // }
          // this.rootEvents.set(ev.id!, existing);
        }
        // if (found) {
        //   //todo: populate event tree data
        // }
      }
    }
  }
}



function getNestedEvents(events: Map<string, NostrEvent>,
  etags: Map<string, Set<string>>) {

}

export type RecursiveEventMap = Map<string, EventTreeItem>;
function PopulateEventMap(
  m: RecursiveEventMap,
  nempool: Map<string, NDKEvent>
) {
  m.forEach((treeItem) => {
    if (treeItem.dirty) {
    }
  });
}

export class EventTreeItem {
  //id: string; //if we have replies etc but don't have the event itself we need to fetch it
  event: NostrEvent;
  children: RecursiveEventMap;
  reacts(): Map<string, NostrEvent> {
    let m: Map<string, NostrEvent> = new Map();
    for (let [id, { event }] of this.children) {
      if (event.kind! == 7) {
        m.set(id, event);
      }
    }
    return m;
  }
  push(ev: NDKEvent) {
    for (let t of ev.getMatchingTags("e")) {
      if (t.includes(this.event.id!)) {
        if (!this.children.has(ev.id)) {
          this.children.set(ev.id, new EventTreeItem(ev.rawEvent()));
        }
      }
    }
  }
  dirty: boolean;
  root: string | undefined;
  constructor(e: NostrEvent) {
    this.dirty = true;
    this.event = e;
    this.children = new Map();
  }
}
