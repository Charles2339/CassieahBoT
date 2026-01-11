import EventEmitter from "events";
import Stream from "stream";

export class KayeBotEvent {
  implEvents: EventEmitter<KayeBotEvent.ImplementationEvents>;

  constructor() {
    this.implEvents = new EventEmitter();
  }

  dispatch(form: KayeBotEvent.DispatchForm): KayeBotEvent.Response;
  dispatch(
    body: string,
    form: Exclude<KayeBotEvent.DispatchFormStrict, "body">
  ): KayeBotEvent.Response;

  dispatch(): KayeBotEvent.Response {}

  reply() {}
}

export namespace KayeBotEvent {
  export interface BotEvents {
    reply: [KayeBotEvent];
    reaction: [KayeBotEvent];
  }
  export interface ImplementationEvents {}

  export type DispatchForm = string | DispatchFormStrict;

  export interface DispatchFormStrict {
    body?: string | string[];
    bodyMode?: "random" | "line-break";
    attachments?: Stream | Stream[];
  }

  export class Response
    extends EventEmitter<BotEvents>
    implements PromiseLike<Response>
  {
    promiseInternal: Promise<Response>;
    constructor() {
      super();
      let res: Response["resolveInternal"], rej: Response["rejectInternal"];
      const promise = new Promise<Response>((resolve, reject) => {
        res = resolve;
        rej = reject;
      });
      this.promiseInternal = promise;
      this.resolveInternal = res;
      this.rejectInternal = rej;
    }

    then<TResult1 = Response, TResult2 = never>(
      onfulfilled?:
        | ((value: Response) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): PromiseLike<TResult1 | TResult2> {
      return this.promiseInternal.then(onfulfilled, onrejected);
    }

    resolveInternal(_value: Response | PromiseLike<Response>) {}
    rejectInternal(_reason?: any) {}
  }
}
