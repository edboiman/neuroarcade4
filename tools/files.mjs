// Shared helpers for the build and audit scripts.
import { readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', '.github', 'tools', 'node_modules']);
const SKIP_FILES = new Set(['sw.js', 'js/version.js', 'README.md', 'SECURITY.md', 'package.json', '.nojekyll', '.gitignore', 'LICENSE', 'CLAUDE.md', 'fonts/OFL.txt']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(relative(root, p).split('\\').join('/'));
  }
  return out;
}

// Every file that must be available offline (everything the app loads, except the stamped sw.js / version.js).
export const appFiles = () => walk(root).filter((f) => !SKIP_FILES.has(f) && !f.endsWith('.zip'));
// Everything that ships to the phone and so must be audited.
export const shippedFiles = () => [...appFiles(), 'sw.js', 'js/version.js'];
