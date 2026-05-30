import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const tempDir = path.join(tmpdir(), 'omegalog-daily-summary-tests');
const testFiles = [
  'src/domain/dailySummary.test.ts',
  'src/api/summaryGenerationClient.test.ts',
  'src/api/localFileAdapter.smoke.test.ts',
];

await rm(tempDir, { recursive: true, force: true });
await mkdir(tempDir, { recursive: true });

for (const testFile of testFiles) {
  const outfile = path.join(tempDir, `${path.basename(testFile, '.ts')}.mjs`);
  await build({
    entryPoints: [testFile],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    sourcemap: 'inline',
    logLevel: 'silent',
  });

  await import(`${pathToFileURL(outfile).href}?run=${Date.now()}`);
}
