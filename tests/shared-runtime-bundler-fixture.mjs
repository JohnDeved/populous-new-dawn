// Invoked by shared_runtime_storage_test.py with isolated, Git-bound asset trees.
import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

const [runtime, legacy, viteEntry] = process.argv.slice(2);
const { build, version } = await import(pathToFileURL(viteEntry).href);
const config = (root, entry) => ({
  root,
  configFile: false,
  envFile: false,
  publicDir: false,
  cacheDir: path.join(root, 'work/vite-cache'),
  logLevel: 'silent',
  css: { postcss: { plugins: [] } },
  build: {
    write: false,
    copyPublicDir: false,
    emptyOutDir: false,
    assetsInlineLimit: 0,
    minify: false,
    cssMinify: false,
    rolldownOptions: {
      input: path.join(root, 'app', entry),
      output: { format: 'es' },
    },
  },
});

// Preserve Vite/Node's normal symlink behavior, including pnpm package identity.
const output = await build(config(runtime, 'main.js'));
const chunks = output.output.filter(item => item.type === 'chunk');
assert.equal(chunks.length, 1);
const context = {};
vm.runInNewContext(chunks[0].code, context, { timeout: 1000 });
const result = JSON.parse(JSON.stringify(context.sharedAssetResult));
assert.deepEqual(result.runtime, { version: 1, name: 'runtime' });
assert.deepEqual(result.provenance, { version: 2, name: 'provenance' });
assert.equal(result.label, 'relative-json');
assert.equal(result.raw, '{"version":1,"name":"runtime"}\n');

const emitted = output.output.filter(item => item.type === 'asset');
const sourceNames = { png: 'pixel.png', wav: 'sound.wav', m4a: 'sound.m4a', webm: 'movie.webm', bin: 'game.bin' };
for (const [extension, source] of Object.entries(sourceNames)) {
  assert.equal(path.extname(result[extension]), `.${extension}`);
  const asset = emitted.find(item => `/${item.fileName}` === result[extension]);
  assert.ok(asset, `Missing emitted ${extension} asset`);
  assert.deepEqual(Buffer.from(asset.source), readFileSync(path.join(runtime, 'public/original/sub', source)));
  assert.equal(path.basename(realpathSync(path.join(runtime, 'public/original/sub', source))), source);
}
const css = emitted.find(item => item.fileName.endsWith('.css'));
assert.ok(css, 'Missing compiled stylesheet');
const cssText = Buffer.from(css.source).toString();
assert.match(cssText, /\.nested/);
assert.match(cssText, /11,\s*22,\s*33/);
assert.ok(cssText.includes(result.png), 'CSS relative image URL did not resolve to the shared PNG');

// Prove the regression can detect the retired extensionless layout. Only JSON
// imports are used here, so missing module-relative files cannot mask the defect.
assert.equal(path.extname(realpathSync(path.join(legacy, 'public/original/world-selector/text/runtime.json'))), '');
let legacyFailure;
await assert.rejects(build(config(legacy, 'legacy.js')), error => {
  const details = error.errors ?? [];
  legacyFailure = details.map(({ code, id, message }) => ({ code, id, message }));
  return details.some(detail => detail.code === 'PARSE_ERROR') &&
    JSON.stringify(details).includes('/blobs/');
}, 'Legacy JSON must fail parsing at its extensionless CAS target');

console.log(JSON.stringify({ status: 'passed', viteVersion: version,
  v2: { status: 'passed', types: ['json', 'mjs', 'css', 'txt?raw', ...Object.keys(sourceNames)],
    evaluated: result, emitted: emitted.map(item => item.fileName) },
  v1: { status: 'failed-as-expected', errors: legacyFailure } }));
