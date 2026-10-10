(function () {
  'use strict';

  var STORAGE_KEY = 'hive-site-language';
  var labels = { en: 'Language', de: 'Sprache', zh: '语言' };
  var originals = new WeakMap();
  var lastText = new WeakMap();
  var originalAttributes = new WeakMap();
  var lastAttributes = new WeakMap();
  var dictionaries = null;
  var activeLanguage = 'en';
  var observer = null;
  var queued = false;

  function getSavedLanguage() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      return value === 'de' || value === 'zh' ? value : 'en';
    } catch (_) { return 'en'; }
  }

  function preserveSpace(source, translated) {
    var leading = (source.match(/^\s*/) || [''])[0];
    var trailing = (source.match(/\s*$/) || [''])[0];
    return leading + translated + trailing;
  }

  function translateText(node, language) {
    if (!originals.has(node)) originals.set(node, node.data);
    else if (lastText.has(node) && node.data !== lastText.get(node)) originals.set(node, node.data);
    var source = originals.get(node);
    var key = source.trim();
    var result = language === 'en' || !dictionaries[language] || !dictionaries[language][key]
      ? source
      : preserveSpace(source, dictionaries[language][key]);
    if (node.data !== result) node.data = result;
    lastText.set(node, result);
  }

  function translateAttributes(element, language) {
    ['title', 'placeholder', 'aria-label', 'alt', 'content'].forEach(function (name) {
      if (!element.hasAttribute(name)) return;
      var values = originalAttributes.get(element);
      if (!values) { values = {}; originalAttributes.set(element, values); }
      var last = lastAttributes.get(element);
      if (!Object.prototype.hasOwnProperty.call(values, name) || (last && last[name] !== element.getAttribute(name))) {
        values[name] = element.getAttribute(name);
      }
      var source = values[name];
      var translated = language !== 'en' && dictionaries[language] && dictionaries[language][source.trim()];
      var result = translated ? preserveSpace(source, translated) : source;
      if (element.getAttribute(name) !== result) element.setAttribute(name, result);
      last = last || {};
      last[name] = result;
      lastAttributes.set(element, last);
    });
  }

  function translatePage(language) {
    activeLanguage = language;
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent || parent.closest('script,style,noscript,svg,select,option')) return NodeFilter.FILTER_REJECT;
        return node.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var textNode;
    while ((textNode = walker.nextNode())) translateText(textNode, language);
    document.querySelectorAll('[title],[placeholder],[aria-label],[alt],meta[name="description"]').forEach(function (element) {
      translateAttributes(element, language);
    });
    var titleKey = originalTitle;
    var mappedTitle = language !== 'en' && dictionaries[language] && dictionaries[language][titleKey];
    document.title = mappedTitle || titleKey;
    var select = document.getElementById('hive-language-select');
    if (select) select.setAttribute('aria-label', labels[language] || labels.en);
  }

  var originalTitle = document.title;

  function installSelector() {
    if (document.getElementById('hive-language-select')) return;
    var host = document.querySelector('.nav-actions') || document.querySelector('#site-nav .nav') || document.querySelector('.nav') || document.querySelector('.top .nav');
    if (!host) host = document.body;
    var wrap = document.createElement('label');
    wrap.className = 'hive-language-control';
    wrap.setAttribute('aria-label', labels.en);
    var select = document.createElement('select');
    select.id = 'hive-language-select';
    select.setAttribute('aria-label', labels.en);
    select.innerHTML = '<option value="en">English</option><option value="de">Deutsch</option><option value="zh">简体中文</option>';
    select.value = getSavedLanguage();
    wrap.appendChild(select);
    var style = document.createElement('style');
    style.textContent = '.hive-language-control{display:inline-flex;align-items:center;margin-left:8px}.hive-language-control select{appearance:auto;min-height:34px;max-width:132px;padding:0 10px;border:1px solid var(--line-2,#343944);border-radius:9px;background:var(--surface,#11141a);color:var(--text,#f4f5f7);font:600 12px/1.2 Inter,system-ui,sans-serif;cursor:pointer}.hive-language-control select:focus-visible{outline:2px solid var(--accent,#f08a24);outline-offset:2px}@media(max-width:680px){.hive-language-control{margin-left:4px}.hive-language-control select{max-width:116px;min-height:32px}}';
    document.head.appendChild(style);
    host.appendChild(wrap);
    select.addEventListener('change', function () {
      var language = select.value;
      try { localStorage.setItem(STORAGE_KEY, language); } catch (_) {}
      translatePage(language);
    });
  }

  function startObserver() {
    observer = new MutationObserver(function (records) {
      if (queued) return;
      if (!records.some(function (record) { return record.type === 'childList' || record.type === 'characterData' || record.type === 'attributes'; })) return;
      queued = true;
      Promise.resolve().then(function () {
        queued = false;
        if (activeLanguage !== 'en') translatePage(activeLanguage);
      });
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label', 'alt', 'content'] });
  }

  fetch('/hive-languages.json', { cache: 'no-cache' })
    .then(function (response) { if (!response.ok) throw new Error('Language data unavailable'); return response.json(); })
    .then(function (data) {
      dictionaries = data;
      installSelector();
      translatePage(getSavedLanguage());
      startObserver();
    })
    .catch(function () { /* Keep the English page usable if local language data fails to load. */ });
})();
