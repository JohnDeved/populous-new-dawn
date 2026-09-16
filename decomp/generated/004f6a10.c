/* Ghidra 12.1.3 pseudocode; entry 004f6a10; FUN_004f6a10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f6a10(int param_1,int param_2,undefined4 param_3,undefined4 param_4)

{
  int iVar1;

  iVar1 = get_struct_56B_spell_type(param_2,(int)*(char *)(param_1 + 0xc22));
  if ((iVar1 == 3) || (*(int *)((int)&DAT_005a80d4 + param_2 * 0x3e) <= *(int *)(param_1 + 0x94d)))
  {
    iVar1 = FUN_00462d40(param_1,0xe);
    if (iVar1 < 1) {
      iVar1 = get_tribe_sub_struct(param_1);
      if (iVar1 != -1) {
        set_sub_struct(param_1,iVar1,0xe,param_2,param_3,param_4,0);
      }
    }
  }
  return;
}
