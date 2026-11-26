'use strict';
const fs = require('node:fs');
const path = require('node:path');
const mod = require('node:module');
const assert = require('node:assert/strict');

const root = fs.realpathSync(process.argv[2]);
const virtual = path.join(root, 'node_modules', '.pnpm');
const inside = (entry) => {
  const actual = fs.realpathSync(entry);
  assert(actual.startsWith(virtual + path.sep), 'dependency escaped private virtual store: ' + actual);
  return actual;
};
function ownManifest(entry, name, version) {
  let dir = path.dirname(inside(entry));
  while (dir.startsWith(virtual + path.sep)) {
    const f = path.join(dir, 'package.json');
    if (fs.existsSync(f)) {
      const data = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (data.name) {
        assert.equal(data.name, name);
        assert.equal(data.version, version);
        return inside(f);
      }
    }
    dir = path.dirname(dir);
  }
  throw new Error('no owned package manifest for ' + name);
}
const project = mod.createRequire(path.join(root, 'package.json'));
const vitePkg = ownManifest(project.resolve('vite/package.json'), 'vite', '8.0.13');
const viaVite = mod.createRequire(vitePkg);
const rolldown = viaVite.resolve('rolldown');
const rolldownPkg = ownManifest(rolldown, 'rolldown', '1.0.1');
const target = '@rolldown/binding-linux-x64-gnu';
const viaRolldown = mod.createRequire(rolldownPkg);
const binding = inside(viaRolldown.resolve(target));
ownManifest(binding, target, '1.0.1');
assert(binding.endsWith('.node'), 'selected package did not resolve to a native binding');
assert.equal(process.platform, 'linux');
assert.equal(process.arch, 'x64');
assert(process.report.getReport().header.glibcVersionRuntime);
const loaded = viaRolldown(target);
assert(Object.keys(loaded).length > 0, 'native binding exported nothing');
const st = fs.statSync(binding, {bigint: true});
const pwPkg = ownManifest(project.resolve('@playwright/test/package.json'), '@playwright/test', '1.63.0');
ownManifest(mod.createRequire(pwPkg).resolve('playwright/package.json'), 'playwright', '1.63.0');
console.log(JSON.stringify({binding: path.relative(root, binding), device: String(st.dev),
  inode: String(st.ino), bytes: String(st.size), nativeExports: Object.keys(loaded).length,
  pinnedVersions: {vite: '8.0.13', rolldown: '1.0.1', playwright: '1.63.0'}}));
