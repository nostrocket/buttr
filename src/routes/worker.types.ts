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
  kinds: Map<number, number>;
  rootEvents: RecursiveEventMap;
  constructor() {
    this.connections = new Map();
    this.errors = [];
    this.events = new Map();
    this.kinds = new Map();
    this.rootEvents = new Map();
  }
  PushEvent(ev: NostrEvent): void {
    if (!this.events.has(ev.id!)) {
      this.events.set(ev.id!, ev);
      let existing = this.kinds.get(ev.kind!);
      if (!existing) {
        existing = 0;
      }
      existing++;
      this.kinds.set(ev.kind!, existing);
      let e = new NDKEvent(undefined, ev);
      let found = false;
      for (let t of e.getMatchingTags("e")) {
        if (!t.includes("mention")) {
          found = true;
        }
      }
      if (!found) {
        let existing = this.rootEvents.get(ev.id!);
        if (!existing) {
          existing = new EventTreeItem(ev.id!, ev);
        }
        if (!existing.event) {
          existing.event = ev
        }
        this.rootEvents.set(ev.id!, existing)
      }
      //if found, populate
      //hand root event detection etc
    }
  }
}

export type RecursiveEventMap = Map<string, EventTreeItem>;
export class EventTreeItem {
  id: string; //if we have replies etc but don't have the event itself we need to fetch it
  event: NostrEvent | undefined;
  directReplies: RecursiveEventMap;
  mentions: RecursiveEventMap;
  reacts: Map<string, NostrEvent>;
  reposts: Map<string, NostrEvent>;
  constructor(id: string, e?: NostrEvent) {
    this.event = e;
    if (id.length != 64) {
      throw new Error("invalid event ID, this should never happen");
    }
    this.id = id;
    this.directReplies = new Map();
    this.mentions = new Map();
    this.reacts = new Map();
    this.reposts = new Map();
  }
}
