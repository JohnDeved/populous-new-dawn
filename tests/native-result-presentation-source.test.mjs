import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as c from '../decomp/research/result-presentation/contract.mjs';
const root = new URL('../decomp/research/result-presentation/', import.meta.url);
const load = name => readFileSync(new URL(name, root));
const source = JSON.parse(load('native.json'));
const nav = JSON.parse(readFileSync(new URL('../decomp/research/result-navigation/native.json', import.meta.url)));
const metrics = JSON.parse(load('metrics.json')), cases = JSON.parse(load('cases.json'));
const provenance = JSON.parse(load('provenance.json'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const at = (address, count) => {
  const span = [...source.spans, ...nav.spans].find(s => parseInt(s.start, 16) <= address && address + count <= parseInt(s.end, 16));
  assert.ok(span, `Missing source span at ${address.toString(16)}`);
  return Buffer.from(span.hex, 'hex').subarray(address - parseInt(span.start, 16), address - parseInt(span.start, 16) + count);
};
const bytes = (address, hex) => assert.equal(at(address, hex.length / 2).toString('hex'), hex);
const u32 = address => at(address, 4).readUInt32LE();
const call = address => { bytes(address, 'e8'); return address + 5 + at(address + 1, 4).readInt32LE(); };
const glyph = (ch, font) => metrics.fontMetrics[font][ch];
const width = (s, font) => [...s].reduce((sum, ch) => sum + glyph(ch, font).w, 0);
const layout = (w, h) => c.statisticsLayout(w, h, glyph, width, metrics.nativeRows);

test('all retained ranges and listings are hash-pinned original static evidence', () => {
  assert.equal(source.executableSha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f');
  assert.equal(source.executableSha256, nav.executableSha256);
  for (const [name, hash] of Object.entries(provenance.files)) assert.equal(digest(load(name)), hash, name);
  for (const span of source.spans) {
    const data = Buffer.from(span.hex, 'hex');
    assert.equal(data.length, parseInt(span.end, 16) - parseInt(span.start, 16));
    assert.equal(digest(data), span.sha256);
  }
  assert.doesNotMatch(load('native.asm').toString(), /\(bad\)|\.byte /);
});
test('rate12 is initialized through a typed settings record, then settings may override', () => {
  bytes(0x5a9d6c, '61d18900000000000c0000000c0000000100011c');
  assert.equal(u32(0x49a9c0), 0x49a97a);
  bytes(0x49a97a, '8a06'); bytes(0x49a980, '8807');
  assert.equal(call(0x4a44e9), 0x49a940); assert.equal(call(0x4a44ee), 0x49a9d0);
  assert.equal(c.sourceIntervalMs(c.sourceInputRate), 83);
  assert.equal(4 * c.sourceIntervalMs(12), 332); assert.equal(6 * c.sourceIntervalMs(12), 498);
});
test('scheduler uses imported GetTickCount and admitted cycles, not renders', () => {
  assert.deepEqual(source.imports.map(i => [i.dll, i.name, i.iat]), [['KERNEL32.dll', 'GetTickCount', '00d0c784']]);
  bytes(0x4a5595, '8a0d61d18900'); bytes(0x4a559b, 'b8e803000099f7f9');
  bytes(0x4a55a7, '8b3584c7d000'); bytes(0x4a55bb, 'ffd648');
  assert.equal(call(0x4a5946), 0x43e480);
  bytes(0x43e871, 'ff0584d18900');
  bytes(0x4a5971, '0fbe3dac5d890047');
  assert.equal(call(0x4a59ad), 0x4ec6f0);
  bytes(0x4a59c1, '01052cd95c00');
  assert.equal(call(0x4a4755), 0x4a4960); assert.equal(call(0x4a4b6a), 0x4a5590); assert.equal(call(0x4a4c07), 0x522570);
});
test('simulation eligibility counter is separate, paused-gated and unsigned', () => {
  bytes(0x4ec6f0, 'f60561c6890002'); bytes(0x4ec703, 'ff0588d18900');
  bytes(0x4ab498, '833d88d189000a'); bytes(0x4abd86, '833d88d189000a');
  for (const [counter, expected] of [[0,false],[10,false],[11,true],[0x80000000,true],[0xffffffff,true],[0x100000000,false]])
    assert.equal(c.resultInputEligible(counter), expected);
  const initial = { inputCycle: 5, simulationCounter: 10, admitted: true };
  assert.deepEqual(c.admittedCycle(initial), { inputCycle: 6, simulationCounter: 11 });
  assert.deepEqual(c.admittedCycle({...initial, landPaused: true}), { inputCycle: 6, simulationCounter: 10 });
  assert.deepEqual(c.admittedCycle({...initial, popupOwnsSimulation: true}), { inputCycle: 6, simulationCounter: 10 });
  assert.deepEqual(c.admittedCycle({...initial, speedExtra: 4}), { inputCycle: 6, simulationCounter: 15 });
  assert.deepEqual(c.admittedCycle({...initial, admitted: false}), { inputCycle: 5, simulationCounter: 10 });
  assert.deepEqual(c.admittedCycle({inputCycle: 0xffffffff, simulationCounter: 0xffffffff, admitted: true}), { inputCycle: 0, simulationCounter: 0 });
});
test('fresh-level initializer resets both counters, not just a global presentation session', () => {
  bytes(0x42bfa7, '33db'); bytes(0x42bfd3, '891d84d18900'); bytes(0x42bfdc, '891d88d18900');
  bytes(0x42c010, '881dac5d8900');
  assert.equal(call(0x42b597), 0x42bfa0); assert.equal(call(0x42c827), 0x42bfa0);
});
test('blink phases are uint32 divide4/divide6 and status complement, not 24Hz animation', () => {
  bytes(0x4a4716, 'a184d18900'); bytes(0x4a471d, 'f7f1');
  for (const fixture of cases.phases) assert.deepEqual(c.resultPhases(fixture.inputCycle), fixture.expected);
  assert.deepEqual(c.resultPhases(6), {overlay:true,statisticsStatusValue:false,statisticsPrompt:true});
  assert.deepEqual(c.resultPhases(12), {overlay:false,statisticsStatusValue:true,statisticsPrompt:true});
  bytes(0x523a42, '803d8b79890000'); bytes(0x5242bb, '803d8b79890000'); bytes(0x524968, '803d8979890000');
});
test('Western draw vtables ignore the color argument instead of recoloring glyphs', () => {
  bytes(0x523a80, '6888165900'); bytes(0x524014, '6888165900');
  assert.equal(u32(0x591688 + 12), 0x527a00);
  assert.equal(u32(0x591698 + 12), 0x527a60);
  bytes(0x516d39, '817c240498165900'); bytes(0x516d48, 'b800a25d00');
  assert.equal(u32(0x5da200 + 12), 0x516c80);
  assert.equal(call(0x527a1b), 0x52a7e0);
  bytes(0x516cd4, 'f60574a05d0008'); bytes(0x516cdb, 'b8ffffff00');
  bytes(0x523f86, '832574a05d00f7'); bytes(0x5248b4, '832574a05d00f7');
  assert.equal(call(0x52407f), 0x523d40);
});
test('normal and small geometry agree with source widths and independent normal fixture', () => {
  for (const fixture of cases.layouts) assert.deepEqual(layout(...fixture.screen), fixture.expected);
  const {font, rowYs, ...normal} = layout(640,480);
  assert.deepEqual(normal, metrics.reference640);
  assert.deepEqual(rowYs, metrics.nativeRows.map(row => row.y));
  assert.equal(font,3); assert.equal(layout(639,480).font,4); assert.equal(layout(1600,200).font,3);
  assert.equal(layout(640,220).groupGap,3); assert.equal(layout(640,221).groupGap,5);
  assert.equal(layout(512,384).counterValueStartX,177); assert.equal(layout(512,384).counterReserveWidth,51);
  for (const fixture of cases.widths) for (const [s,w] of Object.entries(fixture.strings)) assert.equal(width(s,fixture.font),w);
});
test('overlay uses battlefield viewport, separate horizontal centers, signed truncation and no clamp', () => {
  assert.deepEqual(c.terminalOverlayGeometry({x:96,y:0,width:544,height:480},134,138,19), {
    status:{x:301,y:403},prompt:{x:299,y:422}});
  assert.deepEqual(c.terminalOverlayGeometry({x:0,y:0,width:1,height:1},134,138,19), {
    status:{x:-66,y:-15},prompt:{x:-68,y:4}});
});
test('stats centers post-HUD viewport and preserves native strict greater-than prompt clamp', () => {
  assert.deepEqual(c.statisticsPlacement({x:0,y:0,width:640,height:480},480,layout(640,480),138),{
    x:128,y:56,prompt:{x:251,y:428}});
  assert.deepEqual(c.statisticsPlacement({x:0,y:0,width:320,height:200},200,layout(320,200),83),{
    x:40,y:-4,prompt:{x:118,y:189}});
  const tiny = {panelWidth:100,panelHeight:100,lineHeight:18};
  assert.equal(c.statisticsPlacement({x:0,y:96,width:100,height:100},200,tiny,20).prompt.y,200);
  assert.equal(c.statisticsPlacement({x:0,y:97,width:100,height:100},200,tiny,20).prompt.y,180);
  // Full status width sets the origin before the value is hidden.
  assert.equal(c.headingOrigin(layout(512,384),130),55);
  assert.notEqual(c.headingOrigin(layout(512,384),70),55);
  bytes(0x5249c3, '3bf97e0c');
});
