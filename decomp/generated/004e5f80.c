/* Ghidra 12.1.3 pseudocode; entry 004e5f80; FUN_004e5f80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004e5f80(undefined4 param_1,undefined4 param_2)

{
  int iVar1;

  iVar1 = FUN_004627f0(param_1,0x13,0);
  if (iVar1 != 0) {
    iVar1 = FUN_004f92b0(param_1);
    if (iVar1 != 0) {
      FUN_00462790(param_1,param_2,0x13,0,0,0,0);
      return 1;
    }
  }
  return 0;
}
