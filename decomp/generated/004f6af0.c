/* Ghidra 12.1.3 pseudocode; entry 004f6af0; FUN_004f6af0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f6af0(int param_1,undefined4 param_2)

{
  switch(param_2) {
  case 1:
  case 2:
    return (int)*(short *)(param_1 + 0xba9) + (int)*(short *)(param_1 + 0xba7);
  case 3:
  case 4:
    return (int)*(short *)(param_1 + 0xbad) + (int)*(short *)(param_1 + 0xbab);
  default:
    return 999;
  }
}
