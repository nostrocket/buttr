import type { NDKEvent, NostrEvent } from "@nostr-dev-kit/ndk";

export class Command {
  command: "start" | "stop" | "connect" | "print";
  pubkey?: string;
  constructor(
    command: "start" | "stop" | "connect" | "print",
    pubkey?: string
  ) {
    this.command = command;
    this.pubkey = pubkey?pubkey:""
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
  constructor() {
    this.connections = new Map();
    this.errors = [];
    this.events = new Map();
    this.kinds = new Map();
  }
}
//   export type Response = {
//     count: number
//     connections: Map<string, number>
//   }
