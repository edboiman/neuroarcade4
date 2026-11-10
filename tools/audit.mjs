// Security audit. Fails if the app could reach the network, run injected code, or drift from its offline file list.
// Run:  node tools/audit.mjs      (CI runs it on every push and pull request)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, appFiles, shippedFiles } from './files.mjs';

const problems = [];
const fail = (msg) => problems.push(msg);
const read = (f) => readFileSync(join(root, f), 'utf8');

const FORBIDDEN = [
  [/\bfetch\s*\(/, 'network call: fetch()'],
  [/XMLHttpRequest/, 'network call: XMLHttpRequest'],
  [/\bWebSocket\b/, 'network call: WebSocket'],
  [/sendBeacon/, 'network call: sendBeacon'],
  [/\bEventSource\b/, 'network call: EventSource'],
  [/importScripts/, 'importScripts'],
  [/\beval\s*\(/, 'eval()'],
  [/new\s+Function\b/, 'new Function()'],
  [/\.innerHTML\b/, 'innerHTML'],
  [/\.outerHTML\b/, 'outerHTML'],
  [/insertAdjacentHTML/, 'insertAdjacentHTML'],
  [/document\.write/, 'document.write'],
  [/setAttribute\(\s*['"]style['"]/, "setAttribute('style') (blocked by CSP; use element.style)"],
  [/\bdocument\.cookie\b/, 'cookies'],
  [/navigator\.(geolocation|mediaDevices|clipboard|bluetooth|usb|serial)/, 'sensitive device API'],
  [/window\.open\s*\(/, 'window.open'],
  [/\blocation\.(href|assign|replace)\s*[=(]/, 'navigation away from the app'],
  [/\b(setTimeout|setInterval)\s*\(\s*['"`]/, 'string passed to a timer'],
  [/<iframe|<embed|<object/i, 'embedded content'],
];
const HTTP = /https?:\/\/[^\s'"`)]+/g;
const ALLOWED_URLS = new Set(['http://www.w3.org/2000/svg']);

for (const f of shippedFiles()) {
  if (/\.(png|ico|jpg|webp|woff2?)$/.test(f)) continue;
  const text = read(f);
  for (const [re, label] of FORBIDDEN) {
    if (f === 'sw.js' && label === 'network call: fetch()') continue;
    if (re.test(text)) fail(`${f}: forbidden ${label}`);
  }
  for (const url of text.match(HTTP) || []) if (!ALLOWED_URLS.has(url)) fail(`${f}: external URL ${url}`);
  if (/\blocalStorage\b/.test(text) && f !== 'js/store.js') fail(`${f}: localStorage may only be used in js/store.js`);
  if (f.endsWith('.js') && f !== 'sw.js') {
    for (const m of text.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)|from\s+['"]([^'"]+)['"]/g)) {
      const spec = m[1] || m[2];
      if (!spec.startsWith('./') && !spec.startsWith('../')) fail(`${f}: non-relative import "${spec}"`);
    }
  }
}
// sw.js must not call fetch() at all (cache only); only addEventListener('fetch') is allowed.
if (/\bfetch\s*\(/.test(read('sw.js'))) fail('sw.js: fetch() call');

// Content Security Policy
const html = read('index.html');
const cspMatch = html.match(/Content-Security-Policy"\s+content="([^"]+)"/);
if (!cspMatch) fail('index.html: missing Content-Security-Policy');
else {
  const csp = cspMatch[1];
  for (const need of ["default-src 'none'", "script-src 'self'", "style-src 'self'", "connect-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) {
    if (!csp.includes(need)) fail(`CSP is missing ${need}`);
  }
  if (/unsafe-inline|unsafe-eval|\*|https?:/.test(csp)) fail('CSP allows unsafe sources');
}
if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) fail('index.html: inline <script>');
if (/\son[a-z]+\s*=/i.test(html)) fail('index.html: inline event handler attribute');
if (/\sstyle\s*=/i.test(html.replace(/<noscript>[\s\S]*?<\/noscript>/i, ''))) fail('index.html: inline style attribute');

// Offline file list must match what ships
const sw = read('sw.js');
const listed = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean).sort();
const actual = appFiles().sort();
for (const f of actual) if (!listed.includes(f)) fail(`sw.js precache is missing ${f} (run: node tools/build.mjs)`);
for (const f of listed) if (!actual.includes(f)) fail(`sw.js precache lists a missing file ${f}`);
const ver = read('js/version.js').match(/'([0-9a-f]{10})'/);
if (!ver || !sw.includes(`'${ver[1]}'`)) fail('sw.js and js/version.js versions disagree (run: node tools/build.mjs)');

// Manifest sanity
try {
  const man = JSON.parse(read('manifest.webmanifest'));
  for (const i of man.icons) if (!actual.includes(i.src)) fail(`manifest icon missing: ${i.src}`);
  if (man.display !== 'standalone') fail('manifest display should be standalone');
} catch (e) {
  fail('manifest.webmanifest is invalid: ' + e.message);
}

if (problems.length) {
  console.error('AUDIT FAILED');
  for (const p of problems) console.error(' - ' + p);
  process.exit(1);
}
console.log(`Audit passed: ${shippedFiles().length} shipped files, no network access, no injected code, offline list complete.`);
