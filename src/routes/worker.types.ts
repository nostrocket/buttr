
export type Command = {
    command: "start" | "stop" | "print";
    pubkey: string;
  };
  
  export class ResponseData {
    count: number;
    connections: Map<string, number>;
    constructor() {
      this.count = 0;
      this.connections = new Map();
    }
  }
  //   export type Response = {
  //     count: number
  //     connections: Map<string, number>
  //   }
  