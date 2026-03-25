declare module 'phoenix' {
  export class Socket {
    constructor(endPoint: string, opts?: any);
    connect(): void;
    disconnect(): void;
    channel(topic: string, params?: object): Channel;
  }

  export class Channel {
    join(): Push;
    leave(): Push;
    on(event: string, callback: (payload: any) => void): void;
    off(event: string): void;
    push(event: string, payload: object): Push;
  }

  export class Push {
    receive(status: string, callback: (response?: any) => void): Push;
  }
}
