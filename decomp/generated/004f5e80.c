/* Ghidra 12.1.3 pseudocode; entry 004f5e80; FUN_004f5e80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f5e80(undefined4 param_1,undefined4 param_2,undefined4 param_3,undefined2 param_4)

{
  int iVar1;

  iVar1 = FUN_004627f0(param_1,0,param_2);
  if (iVar1 != 0) {
    set_sub_struct(param_1,param_3,0,param_2,param_4,0,0);
    return 1;
  }
  return 0;
}
