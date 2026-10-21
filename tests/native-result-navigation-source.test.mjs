import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../decomp/research/result-navigation/', import.meta.url);
const load = name => readFileSync(new URL(name, root));
const source = JSON.parse(load('native.json'));
const provenance = JSON.parse(load('provenance.json'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const at = (address, count) => {
  const span = source.spans.find(s => parseInt(s.start, 16) <= address
    && address + count <= parseInt(s.end, 16));
  assert.ok(span, `No retained bytes at ${address.toString(16)}`);
  return Buffer.from(span.hex, 'hex').subarray(address - parseInt(span.start, 16),
    address - parseInt(span.start, 16) + count);
};
const u32 = address => at(address, 4).readUInt32LE();
const call = address => {
  assert.equal(at(address, 1)[0], 0xe8);
  return address + 5 + at(address + 1, 4).readInt32LE();
};

test('retained listings and half-open PE spans have exact pinned identities', () => {
  assert.equal(source.executableSha256,
    '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f');
  assert.equal(provenance.executableSha256, source.executableSha256);
  assert.equal(digest(load('native.json')), provenance.nativeJsonSha256);
  assert.equal(digest(load('native.asm')), provenance.nativeAsmSha256);
  assert.equal(new Set(source.spans.map(s => s.name)).size, source.spans.length);
  for (const span of source.spans) {
    const bytes = Buffer.from(span.hex, 'hex');
    assert.equal(bytes.length, parseInt(span.end, 16) - parseInt(span.start, 16));
    assert.equal(digest(bytes), span.sha256, span.name);
  }
});

test('command tables distinguish paused-capable 99 from second-switch 0x5b', () => {
  const dispatch = command => u32(0x4ad5c4 + 4 * at(0x4ad740 + command - 0xd, 1)[0]);
  assert.equal(dispatch(99), 0x4ab498);
  assert.equal(dispatch(0x5b), 0x4aabd1);
  assert.equal(u32(0x4ad814 + 4 * at(0x4ad8dc + 0x5b - 0xf, 1)[0]), 0x4abd86);
  assert.equal(at(0x4abbea, 7).toString('hex'), 'f60561c6890002');
  assert.equal(at(0x4ab498, 7).toString('hex'), '833d88d189000a');
  assert.equal(at(0x4abd86, 7).toString('hex'), '833d88d189000a');
});

test('first result action opens stats, hides HUD, pauses, or uses tutorial bypass', () => {
  assert.equal(at(0x4abd9c, 7).toString('hex'), '830d69c6890020');
  assert.equal(at(0x4abda3, 6).toString('hex'), '6a016a006a08');
  assert.equal(call(0x4abda9), 0x479f00);
  assert.equal(at(0x4abdc2, 5).toString('hex'), '6a01506a0a');
  assert.equal(call(0x4abdc7), 0x479f00);
  assert.equal(call(0x4abdcf), 0x47aaa0);
  assert.equal(call(0x4abddf), 0x41b4f0);
  assert.equal(call(0x4ab4d4), 0x41b4f0);
});

test('default result Space predicate and terminal stats keydown gate are explicit', () => {
  assert.equal(at(0x5d65d4, 12).toString('hex'), '205b000000114000f0f44f00');
  assert.equal(at(0x4aa00a, 3).toString('hex'), '83fe39');
  assert.equal(at(0x4aa013, 6).toString('hex'), '6a006a006a63');
  assert.equal(at(0x4aa0cf, 3).toString('hex'), '83fe1c'); // Popup owns Enter first.
  assert.equal(at(0x4aa0dc, 9).toString('hex'), '6a006a0068b0000000');
});

test('tribe command 0x4a enters special selector 54, never mission 54 data load', () => {
  assert.equal(at(0x41b50a, 5).toString('hex'), '6a366a4a50');
  assert.equal(call(0x41b50f), 0x479cf0);
  assert.equal(at(0x479dc2, 1)[0], 6); // Uses the non-overwriting pending slot.
  assert.equal(u32(0x479d80), 0x479d2c);
  assert.equal(at(0x44242e, 1)[0], 0x22); // 0x4a - 0x0c.
  assert.equal(u32(0x442348), 0x43fb95);
  assert.equal(call(0x43fba0), 0x4858f0);
  assert.equal(at(0x48592a, 6).toString('hex'), '8a0d15a38900');
  assert.equal(at(0x485670, 3).toString('hex'), '83fe36');
  assert.equal(0x485679 + at(0x485675, 4).readInt32LE(), 0x4858dc);
  assert.equal(at(0x4859c9, 2).toString('hex'), '6a00');
  assert.equal(call(0x4859cb), 0x412960);
  const member = provenance.levelSpec;
  assert.equal(member.member, 'data/{app}/levels/levlspc2.dat');
  assert.equal(member.component, 'Component0');
  assert.equal(member.bytes, 924);
  assert.equal(member.sha256, '28649cf28a49aeef9980b7481d2b9d836fe633d89c8c0a7f9641c604eb90608b');
  assert.equal(0x89a315 - 0x89a00d, 0x308);
  assert.equal(Buffer.from(member.tailHex, 'hex')[8], 54);
  assert.equal(member.specialLevel, 54);
  assert.equal(at(0x5a1e50, 13).toString('ascii'), 'LEVLSPC2.DAT\0');
});

test('the extractor rejects an unrecognized executable before emitting evidence', () => {
  const dir = mkdtempSync(join(tmpdir(), 'result-navigation-source-'));
  try {
    const file = join(dir, 'wrong-input.data');
    writeFileSync(file, Buffer.alloc(256));
    const result = spawnSync('python3', ['-B', new URL('../scripts/research-result-navigation.py',
      import.meta.url).pathname, file], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Original executable identity mismatch/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
