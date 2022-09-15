const TAG = 'RSS-FLOW';

const colorMap = {
  debug: `#7f8c8d`,
  log: `#2ecc71`,
  warn: `#f39c12`,
  error: `#c0392b`,
};

const getStyles = (method: keyof typeof colorMap) => {
  return [
    `background: ${colorMap[method]}`,
    `border-radius: 0.5em`,
    `color: white`,
    `font-weight: bold`,
    `padding: 2px 0.5em`,
  ].join(';');
};

const debugMode = true;

export const log = (...msg: any[]) => {
  console.log(`%c${TAG}`, getStyles('log'), ...msg);
};

export const debug = (...msg: any[]) => {
  console.debug(`%c${TAG}`, getStyles('debug'), ...msg);
};

export const warn = (...msg: any[]) => {
  console.warn(`%c${TAG}`, getStyles('warn'), ...msg);
};

export const error = (...msg: any[]) => {
  console.error(`%c${TAG}`, getStyles('error'), ...msg);
};

// eslint-disable-next-line @typescript-eslint/ban-types
export function time(fn: Function, name?: string) {
  return function (...args: any[]) {
    const t0 = performance.now();
    const result = fn.apply(fn, args);
    console.log(
      `%c${fn.name || name}:`,
      getStyles('log'),
      `${(performance.now() - t0).toFixed(2)}ms`
    );
    return result;
  };
}

const Logger = { log, debug, warn, error, time };

export default Logger;
