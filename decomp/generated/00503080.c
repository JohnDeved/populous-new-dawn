/* Ghidra 12.1.3 pseudocode; entry 00503080; FUN_00503080.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00503080(int param_1)

{
  if (DAT_0089c65d != 0) {
    DAT_0089c65d = DAT_0089c65d + -1;
  }
  FUN_004ee1e0(param_1);
  FUN_005030c0(param_1);
  if ((*(byte *)(param_1 + 0x10) & 0x10) != 0) {
    FUN_0048a770(0xc0,param_1);
  }
  return;
}
