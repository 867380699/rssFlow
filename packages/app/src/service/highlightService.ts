import HighlightWorker from '@/worker/highlightWorker?worker';

const highlightWorker = new HighlightWorker();

const resolveMap = new Map();

let id = 0;

highlightWorker.onmessage = (message) => {
  const { id, result } = message.data;
  const callback = resolveMap.get(id);
  resolveMap.delete(id);
  if (callback) {
    callback(result);
  }
};

const highlightCode = (code: string) => {
  return new Promise<string>((resolve) => {
    id++;

    highlightWorker.postMessage({ id, code });
    resolveMap.set(id, resolve);
  });
};

export default { highlightCode };
