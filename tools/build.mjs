// Stamps a content hash into sw.js and js/version.js and regenerates the offline file list.
// Run after any change:  node tools/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { root, appFiles } from './files.mjs';

const files = appFiles();
const hash = createHash('sha256');
for (const f of files) {
  hash.update(f);
  hash.update(readFileSync(join(root, f)));
}
const version = hash.digest('hex').slice(0, 10);

// version.js is excluded from the content hash to avoid a circular hash, but must be cached.
const list = ['./', ...files.map((f) => './' + f), './js/version.js'].map((f) => `  '${f}'`).join(',\n');
let sw = readFileSync(join(root, 'sw.js'), 'utf8');
sw = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`);
sw = sw.replace(/\/\*PRECACHE_START\*\/[\s\S]*?\/\*PRECACHE_END\*\//, `/*PRECACHE_START*/\n${list}\n  /*PRECACHE_END*/`);
writeFileSync(join(root, 'sw.js'), sw);
writeFileSync(join(root, 'js/version.js'), `export const VERSION = '${version}';\n`);
console.log(`Built version ${version} with ${files.length + 2} offline files.`);
