/* Ghidra 12.1.3 pseudocode; entry 004e5530; FUN_004e5530.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e5530(undefined4 param_1,undefined1 param_2,undefined1 param_3)

{
  int iVar1;
  undefined2 uStack_2;

  uStack_2 = CONCAT11(param_3,param_2);
  iVar1 = get_tribe_sub_struct(param_1);
  if (iVar1 != -1) {
    set_sub_struct(param_1,iVar1,0,4,uStack_2,1,0);
  }
  return;
}
