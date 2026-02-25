/**
 * Throttle and debounce utilities.
 * All functions are properly typed with TypeScript generics.
 */

/**
 * Debounce a function — delays invoking `fn` until after `ms` milliseconds
 * have elapsed since the last call.
 *
 * @param fn  Function to debounce
 * @param ms  Quiet-period in milliseconds
 * @returns   Debounced version of `fn`
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, ms);
  };
}

/**
 * Throttle a function — invokes `fn` at most once per `ms` milliseconds.
 * Trailing calls during the quiet window are dropped.
 *
 * @param fn  Function to throttle
 * @param ms  Minimum interval in milliseconds
 * @returns   Throttled version of `fn`
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>): void => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Batch-debounce — accumulates individual items into a buffer and calls `fn`
 * with the full batch after `ms` milliseconds of inactivity.
 * Useful for batching high-frequency WS events before a render cycle.
 *
 * @param fn  Function to call with the accumulated batch
 * @param ms  Idle period before flush (default: 200ms)
 * @returns   Function that accepts individual items
 */
export function batchDebounce<T>(
  fn: (items: T[]) => void,
  ms = 200
): (item: T) => void {
  let buffer: T[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (item: T): void => {
    buffer.push(item);
    clearTimeout(timer);
    timer = setTimeout(() => {
      const batch = buffer;
      buffer = [];
      fn(batch);
    }, ms);
  };
}

/**
 * Rate-limited queue — processes items at most `maxPerSecond` items/second.
 * Excess items queue up and are processed in order.
 *
 * @param fn           Handler for each item
 * @param maxPerSecond Max items per second
 * @returns            Enqueue function
 */
export function rateLimit<T>(
  fn: (item: T) => void,
  maxPerSecond: number
): (item: T) => void {
  const queue: T[] = [];
  const intervalMs = 1000 / maxPerSecond;
  let processing = false;

  function processNext(): void {
    if (queue.length === 0) {
      processing = false;
      return;
    }
    const item = queue.shift()!;
    fn(item);
    setTimeout(processNext, intervalMs);
  }

  return (item: T): void => {
    queue.push(item);
    if (!processing) {
      processing = true;
      processNext();
    }
  };
}
