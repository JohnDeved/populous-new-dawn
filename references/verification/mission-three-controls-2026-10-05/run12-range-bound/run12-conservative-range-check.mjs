// Source-only numerical bound. No World, browser, profile or game inputs are created.
import assert from 'node:assert/strict';
import path from 'node:path';
const {nativeSpellRange} = await import(path.join(process.cwd(),'app/spell-casting.ts'));
let minimum=Infinity;
for(let height=0;height<=1024;height++){
  const range=nativeSpellRange(0,0,{height,flags2:0,building:null},2);
  assert(range>=2448); minimum=Math.min(minimum,range);
}
assert.equal(minimum,2448);
const casterToRequested=6,pickDeviation=1.5;
// Two rounded XY positions plus a truncated native distance cost <0.01 world units.
// Reserve0.02 to exceed that source arithmetic uncertainty.
const quantizationAllowance=0.02,margin=minimum/256-casterToRequested-pickDeviation-quantizationAllowance;
assert(margin>=2);
console.log(JSON.stringify({minimumNative:minimum,minimumWorld:minimum/256,nonnegativeHeightDomain:[0,1024],casterToRequestedMaximum:casterToRequested,pickedPointDeviationUpperBound:pickDeviation,quantizationAllowance,minimumMarginWorld:margin,scope:'Conservative source range bound only; actual paused position and nonnegative terrain height remain prerequisites. No claim about old unretained pick/canvas/error or combat immunity.'},null,2));
