// Newly authored tiny WASM binary; no game code, files, memory or toolchain.
// (import "env" "wait" (func (param i32) (result i32)))
// inner(x) = wait(x) * 3; run(x) = inner(x) + 7.
export const bytes = Uint8Array.from([
0,97,115,109,1,0,0,0,
1,6,1,96,1,127,1,127,
2,12,1,3,101,110,118,4,119,97,105,116,0,0,
3,3,2,0,0,
7,7,1,3,114,117,110,0,2,
10,21,2,9,0,32,0,16,0,65,3,108,11,9,0,32,0,16,1,65,7,106,11]);
export function makeModule(){return new WebAssembly.Module(bytes);}
