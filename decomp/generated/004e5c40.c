/* Ghidra 12.1.3 pseudocode; entry 004e5c40; FUN_004e5c40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004e5c40(undefined4 param_1,undefined4 param_2)

{
  int iVar1;

  iVar1 = FUN_004627f0(param_1,0xd,0);
  if (iVar1 == 0) {
    return 0;
  }
  iVar1 = FUN_004f6040(param_1);
  if (iVar1 == 0) {
    return 0;
  }
  iVar1 = FUN_004f6100(iVar1);
  if (iVar1 == 0) {
    return 0;
  }
  FUN_00462790(param_1,param_2,0xd,*(undefined2 *)(iVar1 + 0x24),1,0,0);
  return 1;
}
