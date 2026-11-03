import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const entries = JSON.parse(readFileSync(join(root, 'scripts/file-manifest.json'), 'utf8'));
const header =
  '# FILE_INDEX — смысловой реестр файлов\n\nЭтот индекс генерируется из `scripts/file-manifest.json`. Для каждого файла указан контракт и связанная проверка. Не редактируйте таблицу вручную.\n\n| Путь | Ответственность | Публичный контракт | Зависимости | Проверка | Пересмотр |\n| --- | --- | --- | --- | --- | --- |\n';
const table = entries
  .map(
    (e) =>
      `| \`${e.path}\` | ${e.purpose} | ${e.contract} | ${e.dependencies} | ${e.test} | ${e.review} |`,
  )
  .join('\n');
const output = `${header}${table}\n`;
const target = join(root, 'docs/FILE_INDEX.md');
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output) {
    console.error('FILE_INDEX stale: run pnpm docs:generate');
    process.exit(1);
  }
} else {
  writeFileSync(target, output);
  console.log(`Indexed ${entries.length} modules.`);
}
