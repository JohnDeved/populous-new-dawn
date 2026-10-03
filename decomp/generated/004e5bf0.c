/* Ghidra 12.1.3 pseudocode; entry 004e5bf0; FUN_004e5bf0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004e5bf0(undefined4 param_1,undefined4 param_2)

{
  int iVar1;

  iVar1 = FUN_004627f0(param_1,7,0);
  if (iVar1 != 0) {
    iVar1 = FUN_004f5f70(param_1);
    if (iVar1 != 0) {
      FUN_00462790(param_1,param_2,7,*(undefined2 *)(iVar1 + 0x24),0,0,0);
      return 1;
    }
  }
  return 0;
}
