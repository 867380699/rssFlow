import DOMPurify from 'dompurify';

const parser = new DOMParser();

DOMPurify.removeAllHooks();
DOMPurify.addHook('afterSanitizeElements', (node) => {
  if (node.nodeName === 'IMG') {
    const parentNode = node.parentNode;
    if (parentNode?.nodeName === 'A' && parentNode.childNodes.length === 1) {
      parentNode.insertAdjacentElement('beforebegin', node);
      if (!parentNode.textContent?.trim()) {
        parentNode.textContent = parentNode.getAttribute('href');
      }
    }
  }
  if (node.nodeName === 'BR' && node.previousSibling?.nodeName === 'BR') {
    node.remove();
  }
  if (node.nodeName === 'P' && !node.textContent && !node.childNodes.length) {
    node.remove();
  }
});

export const sanitize = (text: string) => {
  return DOMPurify.sanitize(text, {
    ADD_TAGS: ['iframe'],
  });
};

export const parseXMLString = (text: string) => {
  return parser.parseFromString(text, 'text/xml');
};

export const parseHTMLString = (text: string) => {
  return parser.parseFromString(text, 'text/html');
};
