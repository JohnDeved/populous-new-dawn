/* Ghidra 12.1.3 pseudocode; entry 0048ae00; FUN_0048ae00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0048ae00(int param_1)

{
  undefined4 *puVar1;
  undefined4 *puVar2;
  int iVar3;
  undefined4 uVar4;
  undefined4 *unaff_FS_OFFSET;
  undefined1 local_c4 [12];
  undefined4 local_b8;
  undefined4 *local_18;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_0048af43;
  *unaff_FS_OFFSET = &local_10;
  _DAT_005ae298 = _DAT_005ae298 + 1;
  if ((*(ushort *)(param_1 + 0x18) & 0x40) == 0) {
    if ((*(ushort *)(param_1 + 0x18) & 4) == 0) {
      if (*(int *)(param_1 + 0x1c) == 0) {
        puVar1 = operator_new(8);
        local_8 = 2;
        puVar2 = (undefined4 *)0x0;
        local_18 = puVar1;
        if (puVar1 != (undefined4 *)0x0) {
          FUN_0056e6e0();
          *puVar1 = &PTR_FUN_0058f610;
          puVar1[1] = 0;
          *puVar1 = &PTR_FUN_0058f5e0;
          puVar2 = puVar1;
        }
        local_8 = 0xffffffff;
        *(int *)(param_1 + 0x1c) = (int)puVar2;
        if (puVar2 == (undefined4 *)0x0) {
          FUN_0048afde();
          return;
        }
      }
    }
    else {
      puVar1 = operator_new(8);
      local_8 = 1;
      puVar2 = (undefined4 *)0x0;
      local_18 = puVar1;
      if (puVar1 != (undefined4 *)0x0) {
        FUN_0056e6e0();
        *puVar1 = &PTR_FUN_0058f610;
        puVar1[1] = 0;
        *puVar1 = &PTR_FUN_0058f5f0;
        puVar2 = puVar1;
      }
      local_8 = 0xffffffff;
      *(undefined4 **)(param_1 + 0x1c) = puVar2;
      if (puVar2 == (undefined4 *)0x0) {
        FUN_0048afde();
        return;
      }
    }
  }
  else {
    puVar1 = operator_new(8);
    local_8 = 0;
    puVar2 = (undefined4 *)0x0;
    local_18 = puVar1;
    if (puVar1 != (undefined4 *)0x0) {
      FUN_0056e6e0();
      *puVar1 = &PTR_FUN_0058f610;
      puVar1[1] = 0;
      *puVar1 = &PTR_FUN_0058f600;
      puVar2 = puVar1;
    }
    local_8 = 0xffffffff;
    *(undefined4 **)(param_1 + 0x1c) = puVar2;
    if (puVar2 == (undefined4 *)0x0) {
      FUN_0048afde();
      return;
    }
  }
  local_8 = 0xffffffff;
  iVar3 = (**(code **)(**(int **)(param_1 + 0x1c) + 8))(0,param_1);
  *(int *)(param_1 + 8) = iVar3;
  if (iVar3 != 0) {
    iVar3 = (**(code **)(*sound_related + 0x20))(iVar3);
    if (iVar3 == 0) {
      *(ushort *)(param_1 + 0x18) = *(ushort *)(param_1 + 0x18) & 0xfff7;
      if (*(int *)(param_1 + 0x20) != 0) {
        FUN_0056ccf0();
        uVar4 = FUN_0056e650(*(undefined4 *)(*(int *)(param_1 + 0x20) + 4),0,
                             *(undefined4 *)(*(int *)(param_1 + 0x20) + 8));
        FUN_0056ce10(uVar4);
        local_b8 = 0x3c;
        (**(code **)(*sound_related + 0x14))(*(undefined4 *)(param_1 + 8),local_c4);
        (**(code **)**(undefined4 **)(param_1 + 0x20))();
      }
      goto LAB_0048afe7;
    }
  }
  FUN_0048ad50(param_1);
LAB_0048afe7:
  *unaff_FS_OFFSET = local_10;
  return;
}
