export class RateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval: number;

  constructor(requestsPerSecond: number) {
    this.minInterval = Math.ceil(1000 / requestsPerSecond);
  }

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        const now = Date.now();
        const wait = Math.max(0, this.minInterval - (now - this.lastRequestTime));
        if (wait > 0) {
          await new Promise(r => setTimeout(r, wait));
        }
        this.lastRequestTime = Date.now();
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }
    this.processing = false;
  }
}
