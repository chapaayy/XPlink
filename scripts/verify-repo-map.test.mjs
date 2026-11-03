import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';

test('all important source files are documented', () => {
  assert.match(
    execFileSync(process.execPath, ['scripts/verify-repo-map.mjs'], { encoding: 'utf8' }),
    /verified/,
  );
});
test('FILE_INDEX is current', () => {
  execFileSync(process.execPath, ['scripts/generate-file-index.mjs', '--check']);
});
