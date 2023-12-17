import hljs from 'highlight.js/lib/core';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';

declare let self: DedicatedWorkerGlobalScope;

hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);

self.onmessage = function (event) {
  const { id, code } = event.data;
  const result = hljs.highlightAuto(code);
  self.postMessage({ id, result: result.value });
};
