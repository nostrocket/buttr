
export type Command = {
    command: "start" | "stop" | "connect" | "print";
    pubkey?: string;
  };
  
  export class ResponseData {
    connected: number = 0
    count: number;
    connections: Map<string, number>;
    errors: Error[]
    constructor() {
      this.count = 0;
      this.connections = new Map();
      this.errors = [];
    }
  }
  //   export type Response = {
  //     count: number
  //     connections: Map<string, number>
  //   }
  