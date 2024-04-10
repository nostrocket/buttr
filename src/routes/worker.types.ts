
export type Command = {
    command: "start" | "stop" | "connect" | "print";
    pubkey?: string;
  };
  
  export class ResponseData {
    connected: number = 0
    rawCount: number = 0
    count():number {return this.eventIds.size}
    connections: Map<string, number>;
    errors: Error[]
    eventIds: Set<string>;
    constructor() {
      this.connections = new Map();
      this.errors = [];
      this.eventIds = new Set()
    }
  }
  //   export type Response = {
  //     count: number
  //     connections: Map<string, number>
  //   }
  