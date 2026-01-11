export class Deferred<Res, Rej = unknown> extends Promise<Res> {
  constructor() {
    let res: Deferred<Res>["resolve"];
    let rej: Deferred<Res>["reject"];
    super((res_cb, rej_cb) => {
      res = res_cb;
      rej = rej_cb;
    });
    this.resolve = (value) => {
      this.value = value;
      res(value);
    };
    this.reject = (reason) => {
      this.rejectReason = reason;
      rej(reason);
    };
    this.value = null;
  }

  value: Res | null;

  rejectReason?: Rej | null;

  resolve: (value: Res) => void;
  reject: (reason?: Rej) => void;
}
