/** Serialize writes without letting one rejected write poison subsequent saves. */
export class WriteQueue {
  #tail: Promise<unknown> = Promise.resolve();

  run<T>(write: () => Promise<T>): Promise<T> {
    const pending = this.#tail.then(write);
    this.#tail = pending.catch(() => undefined);
    return pending;
  }
}
