/* Ghidra 12.1.3 pseudocode; entry 0056ddc0; FUN_0056ddc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int * __thiscall FUN_0056ddc0(int *param_1,undefined4 *param_2)

{
  void *pvVar1;
  int iVar2;
  undefined4 *unaff_FS_OFFSET;
  int *local_14;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_0056df83;
  *unaff_FS_OFFSET = &local_10;
  if ((*(byte *)(param_1 + 0xc) & 1) == 0) {
    local_14 = (int *)0x0;
  }
  else {
    switch(*param_2) {
    case 1:
      pvVar1 = operator_new(0x10);
      local_8 = 0;
      if (pvVar1 == (void *)0x0) {
        local_14 = (int *)0x0;
      }
      else {
        local_14 = (int *)FUN_00575430();
      }
      break;
    case 2:
      pvVar1 = operator_new(0x14);
      local_8 = 1;
      if (pvVar1 == (void *)0x0) {
        local_14 = (int *)0x0;
      }
      else {
        local_14 = (int *)FUN_00575250();
      }
      break;
    case 3:
      pvVar1 = operator_new(0x10);
      local_8 = 2;
      if (pvVar1 == (void *)0x0) {
        local_14 = (int *)0x0;
      }
      else {
        local_14 = (int *)FUN_00574fd0();
      }
      break;
    case 4:
      if ((param_1[10] == 0) || (*(int *)(param_1[10] + 0x10) == 0)) {
        local_14 = (int *)0x0;
        goto LAB_0056dfca;
      }
      local_14 = (int *)0x0;
      pvVar1 = operator_new(0x14);
      local_8 = 3;
      if (pvVar1 != (void *)0x0) {
        local_14 = (int *)FUN_00574cf0(*(undefined4 *)(param_1[10] + 0x10));
      }
      break;
    case 5:
      local_14 = (int *)0x0;
      pvVar1 = operator_new(0x18);
      local_8 = 4;
      if (pvVar1 != (void *)0x0) {
        local_14 = (int *)FUN_00573db0();
      }
      break;
    case 6:
      local_14 = (int *)0x0;
      pvVar1 = operator_new(0x38);
      local_8 = 5;
      if (pvVar1 != (void *)0x0) {
        local_14 = (int *)FUN_00574230();
      }
    }
    local_8 = 0xffffffff;
    iVar2 = (**(code **)(*local_14 + 0xc))(param_2[1],param_2[2]);
    if (iVar2 == 0) {
      (**(code **)(*param_1 + 4))();
    }
    else {
      if (local_14 != (int *)0x0) {
        (**(code **)(*local_14 + 8))(1);
      }
      local_14 = (int *)0x0;
    }
  }
LAB_0056dfca:
  *unaff_FS_OFFSET = local_10;
  return local_14;
}
