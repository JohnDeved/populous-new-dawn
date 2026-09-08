/* Ghidra 12.1.3 pseudocode; entry 004a8370; FUN_004a8370.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a8370(int param_1)

{
  char cVar1;
  int iVar2;
  undefined2 extraout_var;
  undefined4 local_c;
  undefined2 local_8;
  undefined2 local_6;
  undefined2 local_4;

  iVar2 = *(int *)(param_1 + 0x6c) + -1;
  *(int *)(param_1 + 0x6c) = iVar2;
  if (iVar2 < 1) {
    local_c = *(undefined4 *)(param_1 + 0x3d);
    cVar1 = FUN_004a8440(&local_c);
    if (cVar1 != '\0') {
      local_4 = 0;
      local_8 = (undefined2)local_c;
      local_6 = local_c._2_2_;
      iVar2 = alloc_unit(CONCAT22((short)((uint)&local_8 >> 0x10),*(undefined2 *)(param_1 + 0x68)),
                         CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x6a)),
                         *(undefined1 *)(param_1 + 0x2f),&local_8);
      if (iVar2 != 0) {
        *(undefined2 *)(iVar2 + 0x86) = unit_type_array_scenery[*(byte *)(iVar2 + 0x2b)].field3_0x6;
        *(undefined2 *)(iVar2 + 0x84) = 0;
        FUN_004a79f0(iVar2,100,0xffffffff);
        update_after_unit_alloc(param_1);
        return;
      }
      *(undefined4 *)(param_1 + 0x6c) = 0x100;
      return;
    }
    *(undefined4 *)(param_1 + 0x6c) = 0x100;
  }
  return;
}
