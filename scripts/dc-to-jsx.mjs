#!/usr/bin/env node
// Converts the Claude Design template (design/project/Trinity Mark 360 App.dc.html)
// into React components under src/components and src/pages.
//
// The design uses a small template language: {{ path }} interpolation,
// <sc-if value>, <sc-for list as>, and style-hover / style-focus attributes.
// This script maps each construct to plain JSX so the app renders exactly like
// the design. Re-run it after the design changes:  npm run sync-design
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'design/project/Trinity Mark 360 App.dc.html');
const html = readFileSync(SRC, 'utf8');
const tpl = html.slice(html.indexOf('</helmet>') + '</helmet>'.length, html.lastIndexOf('</x-dc>'));

// ---------------------------------------------------------------- tokenizer
const VOID = new Set(['input', 'br', 'img', 'meta', 'link', 'hr']);
function parse(src) {
  const root = { tag: '#root', attrs: [], children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(\/?)>/g;
  let last = 0, m;
  const text = t => { if (t) stack.at(-1).children.push({ text: t }); };
  while ((m = re.exec(src))) {
    text(src.slice(last, m.index));
    last = re.lastIndex;
    if (m[0].startsWith('<!--')) continue;
    if (m[1]) {
      const tag = m[1];
      let i = stack.length - 1;
      while (i > 0 && stack[i].tag !== tag) i--;
      if (i === 0) throw new Error('Unmatched </' + tag + '> at ' + m.index);
      stack.length = i;
      continue;
    }
    const attrs = [];
    const ar = /([^\s=>/]+)(?:="([^"]*)")?/g;
    let a;
    while ((a = ar.exec(m[3]))) attrs.push([a[1], a[2] ?? '']);
    const node = { tag: m[2], attrs, children: [] };
    stack.at(-1).children.push(node);
    if (!VOID.has(m[2]) && !m[4]) stack.push(node);
  }
  text(src.slice(last));
  if (stack.length !== 1) throw new Error('Unclosed <' + stack.at(-1).tag + '>');
  return root;
}

// ---------------------------------------------------------------- helpers
const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const attr = (n, k) => (n.attrs.find(a => a[0] === k) || [])[1];

// Resolves a template path against the current loop scope.
// Loop variables named `v` are renamed so they don't hide the `v` prop.
const local = name => (name === 'v' ? 'item' : name);
function expr(path, scope) {
  path = path.trim();
  const [head, ...rest] = path.split('.');
  return scope.includes(head) ? [local(head), ...rest].join('.') : 'v.' + path;
}
const HOLE = /\{\{([\s\S]+?)\}\}/g;
const onlyHole = s => { const m = /^\s*\{\{([\s\S]+?)\}\}\s*$/.exec(s); return m && !m[1].includes('}}') ? m[1] : null; };
function interp(s, scope) {
  const h = onlyHole(s);
  if (h) return expr(h, scope);
  if (!s.includes('{{')) return JSON.stringify(decode(s));
  const out = decode(s).replace(/`/g, '\\`').replace(HOLE, (_, p) => '${' + expr(p, scope) + '}');
  return '`' + out + '`';
}

// style="a:b;c:{{ x }}" -> {{ a: 'b', c: x }}
function styleObj(css, scope) {
  const decls = [];
  let depth = 0, cur = '';
  for (const ch of css) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { decls.push(cur); cur = ''; } else cur += ch;
  }
  decls.push(cur);
  const props = decls.map(d => d.trim()).filter(Boolean).map(d => {
    const i = d.indexOf(':');
    const k = d.slice(0, i).trim(), val = d.slice(i + 1).trim();
    const key = k.startsWith('--') ? JSON.stringify(k) : /^-/.test(k) ? camel(k.slice(1)).replace(/^./, c => c.toUpperCase()) : camel(k);
    return key + ': ' + interp(val, scope);
  });
  return '{ ' + props.join(', ') + ' }';
}

// style-hover / style-focus become shared CSS classes (see interactions.css).
const pseudo = new Map();
function pseudoClass(kind, css) {
  const k = kind + '|' + css;
  if (!pseudo.has(k)) pseudo.set(k, { cls: 'tm-' + kind[0] + (pseudo.size + 1), kind, css });
  return pseudo.get(k).cls;
}

const SVG_KEEP = new Set(['viewBox', 'preserveAspectRatio']);
const RENAME = { class: 'className', for: 'htmlFor', autofocus: 'autoFocus' };

function attrsJsx(n, scope) {
  const out = [], classes = [];
  for (const [k, raw] of n.attrs) {
    if (k.startsWith('hint-')) continue;
    if (k === 'style-hover' || k === 'style-focus') { classes.push(pseudoClass(k.slice(6), decode(raw))); continue; }
    if (k === 'style') { out.push('style={' + styleObj(decode(raw), scope) + '}'); continue; }
    let name = RENAME[k] || k;
    if (name.includes('-') && !/^(data|aria)-/.test(name)) name = camel(name);
    if (SVG_KEEP.has(name)) { out.push(name + '=' + JSON.stringify(raw)); continue; }
    const h = onlyHole(raw);
    if ((name === 'value' || name === 'checked') && h) { out.push(name + '={' + expr(h, scope) + ' ?? ' + (name === 'checked' ? 'false' : "''") + '}'); continue; }
    if (h || raw.includes('{{')) { out.push(name + '={' + interp(raw, scope) + '}'); continue; }
    out.push(name + '=' + JSON.stringify(decode(raw)));
  }
  if (classes.length) out.unshift('className="' + classes.join(' ') + '"');
  return out.length ? ' ' + out.join(' ') : '';
}

function textJsx(t, scope, wrapHoles, rawOnly) {
  const parts = t.split(HOLE);
  let out = '';
  parts.forEach((p, i) => {
    if (i & 1) {
      const e = expr(p, scope);
      out += wrapHoles && !rawOnly ? '<span>{' + e + '}</span>' : '{' + e + '}';
      return;
    }
    if (!p) return;
    let s = decode(p);
    if (/\n/.test(s)) s = s.replace(/\s*\n\s*/g, ' ');
    const lead = /^\s/.test(s), trail = /\s$/.test(s) && s.trim();
    const body = s.trim();
    if (!body) { out += "{' '}"; return; }
    // Keep surrounding spaces in the same text node so glyph shaping matches.
    if (lead || trail || /[{}<>]/.test(body)) { out += '{' + JSON.stringify((lead ? ' ' : '') + body + (trail ? ' ' : '')) + '}'; return; }
    out += body;
  });
  return out;
}

// ---------------------------------------------------------------- emitter
const components = new Map(); // name -> { node, kind }
let extractRules = [];

// Whitespace only affects layout between inline-level neighbours.
const INLINE = new Set(['span', 'b', 'a', 'button', 'svg', 'input', 'select', 'label', 'img', 'br', 'strong', 'em', 'textarea']);
const isInline = n => !!n && (n.text !== undefined ? /\S/.test(n.text) : INLINE.has(n.tag));

function childrenJsx(n, scope, ind) {
  const kids = n.children;
  const raw = n.tag === 'option' || n.tag === 'title' || n.tag === 'textarea';
  const out = [];
  kids.forEach((c, i) => {
    if (c.text !== undefined) {
      if (!c.text.includes('{{') && !c.text.trim()) {
        // Whitespace between siblings renders as a space in the design.
        if (c.text.includes(' ') && isInline(kids[i - 1]) && isInline(kids[i + 1])) out.push(ind + "{' '}");
        return;
      }
      out.push(ind + textJsx(c.text, scope, kids.length > 1 || /\S/.test(c.text.replace(HOLE, '')), raw));
      return;
    }
    out.push(nodeJsx(c, scope, ind));
  });
  // Hand-written pages (src/pages/custom) render after the design's pages.
  if (kids.some(c => c.tag === 'sc-if' && /^\s*\{\{\s*is\./.test(attr(c, 'value') || ''))) out.push(ind + '<CustomPage v={v} />');
  return out.join('\n');
}

function nodeJsx(n, scope, ind) {
  for (const r of extractRules) {
    if (n === emitting) break;
    const name = r(n);
    if (!name) continue;
    components.set(name, { node: n });
    if (n.tag !== 'sc-if') return ind + '<' + name + ' v={v} />';
    return ind + '{' + expr(onlyHole(attr(n, 'value')), scope) + ' ? <' + name + ' v={v} /> : null}';
  }
  const next = ind + '  ';
  if (n.tag === 'sc-if') {
    const cond = expr(onlyHole(attr(n, 'value')), scope);
    return ind + '{' + cond + ' ? (\n' + next + '<>\n' + childrenJsx(n, scope, next + '  ') + '\n' + next + '</>\n' + ind + ') : null}';
  }
  if (n.tag === 'sc-for') {
    const list = expr(onlyHole(attr(n, 'list')), scope);
    const as = attr(n, 'as');
    const idx = '_i' + scope.length;
    return ind + '{(' + list + ' || []).map((' + local(as) + ', ' + idx + ') => (\n' + next + '<Fragment key={' + idx + '}>\n' +
      childrenJsx(n, [...scope, as], next + '  ') + '\n' + next + '</Fragment>\n' + ind + '))}';
  }
  const open = '<' + n.tag + attrsJsx(n, scope);
  if (VOID.has(n.tag) || !n.children.length) return ind + open + ' />';
  const inner = childrenJsx(n, scope, next);
  if (!inner.trim()) return ind + open + ' />';
  return ind + open + '>\n' + inner + '\n' + ind + '</' + n.tag + '>';
}

let emitting = null;
function fileFor(name, node, isPage) {
  emitting = node;
  const body = node.tag === 'sc-if' || node.tag === '#root' ? childrenJsx(node, [], '      ') : nodeJsx(node, [], '      ');
  const used = [...components.keys()].filter(c => c !== name && new RegExp('<' + c + ' ').test(body));
  const rel = isPage ? '../components/' : './';
  const imports = used.map(c => 'import ' + c + " from '" + (pages.has(c) ? (isPage ? './' : '../pages/') : rel) + c + "';").join('\n');
  return "// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.\n" +
    (body.includes('<Fragment') ? "import { Fragment } from 'react';\n" : '') +
    (body.includes('<CustomPage') ? "import CustomPage from '../pages/custom/CustomPage';\n" : '') + (imports ? imports + '\n' : '') +
    '\nexport default function ' + name + '({ v }) {\n  return (\n    <>\n' + body + '\n    </>\n  );\n}\n';
}

// ---------------------------------------------------------------- split
const PAGE_NAMES = {
  dashboard: 'Dashboard', briefing: 'Briefing', projects: 'Projects', project: 'ProjectDetail', tasks: 'Tasks',
  requests: 'Requests', finance: 'Finance', store: 'Store', procurement: 'Procurement', crm: 'Crm', staff: 'Staff',
  notifications: 'Notifications', field: 'FieldApp', staffportal: 'StaffPortal', financeportal: 'FinancePortal',
  reception: 'Reception', storekeeper: 'Storekeeper', rooms: 'Rooms', proposals: 'Proposals', production: 'Production',
  logistics: 'Logistics', documents: 'Documents', reports: 'Reports', calendar: 'Calendar', settings: 'Settings',
  ceomobile: 'MobileApps'
};
const pages = new Map();
const root = parse(tpl);
const top = root.children.filter(c => c.tag);
const byVal = (n, v) => n.tag === 'sc-if' && onlyHole(attr(n, 'value') || '')?.trim() === v;

extractRules = [
  n => byVal(n, 'showSidebar') ? 'Sidebar' : null,
  n => n.tag === 'header' ? 'TopBar' : null,
  n => {
    const h = n.tag === 'sc-if' && onlyHole(attr(n, 'value') || '')?.trim();
    if (h && h.startsWith('is.')) { const nm = PAGE_NAMES[h.slice(3)] + 'Page'; pages.set(nm, h.slice(3)); return nm; }
    return null;
  },
  n => byVal(n, 'modalOpen') ? 'FormModal' : null,
  n => byVal(n, 'cmdOpen') ? 'CommandPalette' : null,
  n => byVal(n, 'aiOpen') ? 'AssistantPanel' : null,
  n => byVal(n, 'phone') && n.children.some(c => c.tag === 'nav') ? 'MobileNav' : null,
  n => n.tag === 'div' && /toastBottom/.test(attr(n, 'style') || '') ? 'Toasts' : null
];

const login = top.find(n => byVal(n, 'showLogin'));
const app = top.find(n => byVal(n, 'showApp'));
components.set('LoginScreen', { node: login });
components.set('AppShell', { node: app });

// Emit every component; extraction happens while walking, so loop until stable.
const emitted = new Map();
let pending = ['LoginScreen', 'AppShell'];
while (pending.length) {
  const name = pending.shift();
  const isPage = pages.has(name);
  const src = fileFor(name, components.get(name).node, isPage);
  emitted.set(name, src);
  for (const c of components.keys()) if (!emitted.has(c) && !pending.includes(c)) pending.push(c);
}
// Second pass so imports see every extracted component.
for (const name of emitted.keys()) emitted.set(name, fileFor(name, components.get(name).node, pages.has(name)));

for (const [name, src] of emitted) {
  const dir = pages.has(name) ? 'src/pages' : 'src/components';
  mkdirSync(join(ROOT, dir), { recursive: true });
  writeFileSync(join(ROOT, dir, name + '.jsx'), src);
}

// Page lookup by page key, used by the phone app shell.
const pageIndex = '// Generated by scripts/dc-to-jsx.mjs: every page component by its page key.\n' +
  [...pages.keys()].map(n => 'import ' + n + " from './" + n + "';").join('\n') +
  '\n\nexport default {\n' + [...pages].map(([n, k]) => '  ' + k + ': ' + n).join(',\n') + '\n};\n';
writeFileSync(join(ROOT, 'src/pages/index.js'), pageIndex);

const css = '/* Generated by scripts/dc-to-jsx.mjs from the design\'s style-hover / style-focus rules. */\n' +
  [...pseudo.values()].map(p => '.' + p.cls + ':' + p.kind + ' { ' +
    p.css.split(';').map(d => d.trim()).filter(Boolean).map(d => d + ' !important').join('; ') + ' }').join('\n') + '\n';
writeFileSync(join(ROOT, 'src/styles/interactions.css'), css);

console.log('Wrote ' + emitted.size + ' components (' + pages.size + ' pages), ' + pseudo.size + ' interaction styles.');
