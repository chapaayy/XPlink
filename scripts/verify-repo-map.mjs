import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const entries = JSON.parse(readFileSync(join(root, 'scripts/file-manifest.json'), 'utf8'));
const paths = new Set(entries.map((x) => x.path));
const errors = [];
function walk(dir) {
  for (const item of readdirSync(join(root, dir), { withFileTypes: true })) {
    const path = relative(root, join(root, dir, item.name)).replaceAll('\\', '/');
    if (item.isDirectory()) walk(path);
    else if (/\.(tsx?|mjs|js|py|sh|ya?ml|webmanifest|html|png)$/.test(item.name) && !paths.has(path))
      errors.push(`Unindexed source: ${path}`);
  }
}
for (const dir of [
  'apps/web/src',
  'apps/web/public',
  'packages/matrix-adapter/src',
  'packages/rtc-adapter/src',
  'scripts',
  'deploy',
  '.github/workflows',
  'tests',
])
  walk(dir);
for (const entry of entries) {
  if (!existsSync(join(root, entry.path))) errors.push(`Missing: ${entry.path}`);
  if (!entry.purpose || !entry.contract || !entry.dependencies || !entry.test || !entry.review)
    errors.push(`Incomplete metadata: ${entry.path}`);
}
for (const file of [
  'README.md',
  'AGENTS.md',
  'PROJECT_MAP.md',
  'FILE_INDEX.md',
  'SECURITY.md',
  'docs/START_HERE.md',
  'docs/PROJECT_MAP.md',
  'docs/SECURITY_MODEL.md',
  'docs/ROADMAP.md',
  'docs/ARCHITECTURE.md',
]) {
  if (!existsSync(join(root, file))) errors.push(`Required documentation: ${file}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Repository map verified: ${entries.length} files indexed.`);
