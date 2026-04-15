import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContextStore = {
  requestId: string;
};

const storage = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

export function runWithRequestContext<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
  return storage.run({ requestId }, fn);
}
