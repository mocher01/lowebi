/**
 * Simple throttle utility to prevent rapid API calls
 * Ensures function is called at most once per specified interval
 */

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  let lastArgs: Parameters<T>;

  return function executedFunction(this: any, ...args: Parameters<T>) {
    lastArgs = args;
    const now = Date.now();

    if (now - lastExecTime > wait) {
      // Execute immediately if enough time has passed
      lastExecTime = now;
      func.apply(this, args);
    } else {
      // Schedule execution for later
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastExecTime = Date.now();
        func.apply(this, lastArgs);
        timeout = null;
      }, wait - (now - lastExecTime));
    }
  };
}

/**
 * Throttle specifically for wizard session updates
 * Prevents multiple rapid calls but ensures last call is never lost
 */
export function throttleWizardUpdate<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number = 2000 // 2 second default
): (...args: Parameters<T>) => Promise<void> {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T>;
  let isExecuting = false;

  return function throttledFunction(...args: Parameters<T>): Promise<void> {
    lastArgs = args;

    return new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(async () => {
        if (isExecuting) {
          // If already executing, schedule another call
          setTimeout(() => throttledFunction(...lastArgs), 100);
          resolve();
          return;
        }

        try {
          isExecuting = true;
          await func(...lastArgs);
        } catch (error) {
          console.error('Throttled function error:', error);
        } finally {
          isExecuting = false;
          timeout = null;
          resolve();
        }
      }, wait);
    });
  };
}