// One-off helper: pull the readable content out of a legacy page into clean semantic HTML.
// Usage: node scripts/extract-legacy.mjs <legacy file> <css selector> > out.html
import { load } from 'cheerio';
import { readFileSync } from 'node:fs';
const [, , file, sel] = process.argv;
const $ = load(readFileSync(file, 'utf8'));
const root = $(sel).first();
root.find('script,style,noscript,nav,footer,form,button,input,select,svg,video,.nav-mobile,[hidden],[aria-hidden="true"]').remove();
root.find('.callout').each((_, el) => { el.tagName = 'aside'; $(el).attr('data-callout', $(el).hasClass('green') ? 'green' : 'honey'); });
const KEEP = new Set(['href', 'id', 'src', 'alt', 'colspan', 'rowspan', 'data-cat', 'data-category', 'data-callout']);
root.find('*').each((_, el) => {
  for (const a of Object.keys(el.attribs || {})) if (!KEEP.has(a)) $(el).removeAttr(a);
  const h = $(el).attr('href');
  if (h && /^https?:/.test(h)) $(el).attr({ target: '_blank', rel: 'noopener noreferrer' });
  if (h && /^[a-z0-9-]+\.html/.test(h)) $(el).attr('href', '/' + h.replace(/\.html/, ''));
  const s = $(el).attr('src'); if (s && !s.startsWith('/') && !/^https?:/.test(s)) $(el).attr('src', '/' + s);
});
// unwrap meaningless wrappers
for (let i = 0; i < 6; i++) root.find('div:not([id]), span:not([id])').each((_, el) => { $(el).replaceWith($(el).contents()); });
console.log(root.html().replace(/\n\s*\n+/g, '\n').trim());
