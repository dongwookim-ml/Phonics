// Observe actual text writes, including transient dialogs and canvas labels.
// Input values are user data; the language picker's native Korean option is intentional.
async function installLanguageAudit(page) {
  await page.addInitScript(() => {
    const hits = new Map();
    let writes = 0;
    const hangul = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/u;
    const record = (source, text) => {
      writes++;
      if (!hangul.test(String(text))) return;
      const key = `${source}: ${String(text).trim()}`;
      if (!hits.has(key)) hits.set(key, { source, text: String(text).trim(), stack: new Error().stack });
    };
    function scan(node) {
      if (!node || /^(SCRIPT|STYLE|INPUT|TEXTAREA)$/.test(node.nodeName)) return;
      if (node.parentElement?.closest('option[value="ko"]')) return;
      if (node.nodeName === 'OPTION' && node.value === 'ko') return;
      if (node.nodeType === Node.TEXT_NODE) record('DOM text', node.nodeValue);
      if (node.nodeType === Node.ELEMENT_NODE) {
        for (const attr of ['title', 'aria-label', 'alt', 'placeholder']) {
          if (node.hasAttribute(attr)) record(`DOM ${attr}`, node.getAttribute(attr));
        }
      }
      for (const child of node.childNodes || []) scan(child);
    }
    function intercept(proto, name) {
      const original = Object.getOwnPropertyDescriptor(proto, name);
      Object.defineProperty(proto, name, { ...original, set(value) { original.set.call(this, value); scan(this); } });
    }
    intercept(Node.prototype, 'textContent');
    intercept(Element.prototype, 'innerHTML');
    const insert = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function(...args) { const result = insert.apply(this, args); scan(this.parentNode || this); return result; };
    const attribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value) {
      attribute.call(this, name, value);
      if (['title', 'aria-label', 'alt', 'placeholder'].includes(name)) record(`DOM ${name}`, value);
    };
    for (const method of ['fillText', 'strokeText']) {
      const original = CanvasRenderingContext2D.prototype[method];
      CanvasRenderingContext2D.prototype[method] = function(text, ...args) { record(`canvas ${method}`, text); return original.call(this, text, ...args); };
    }
    new MutationObserver(records => {
      for (const mutation of records) {
        if (mutation.type === 'characterData') scan(mutation.target);
        for (const node of mutation.addedNodes || []) scan(node);
      }
    }).observe(document, { childList: true, subtree: true, characterData: true });
    document.addEventListener('DOMContentLoaded', () => scan(document.documentElement));
    window.languageAudit = { snapshot: () => ({ writes, hits: [...hits.values()] }) };
  });
}
module.exports = { installLanguageAudit };
