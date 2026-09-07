/* Ghidra 12.1.3 pseudocode; entry 00570e20; FUN_00570e20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00570e20(undefined4 param_1,int param_2,undefined4 *param_3)

{
  uint uVar1;
  undefined4 *puVar2;
  int iVar3;
  undefined4 uVar4;
  undefined4 *unaff_FS_OFFSET;
  LPCRITICAL_SECTION in_stack_ffffffdc;
  undefined4 extraout_var;
  undefined4 local_18;
  int local_14;
  undefined4 uStack_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  uStack_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_00570ec7;
  *unaff_FS_OFFSET = &uStack_10;
  local_14 = 0;
  local_18 = 0;
  if (((*(uint *)(param_2 + 0x14) & 0x80) != 0) && ((*(uint *)(param_2 + 0x14) & 8) != 0)) {
    puVar2 = (undefined4 *)FUN_00571040(param_1,&local_14,param_2);
    if (puVar2 != (undefined4 *)0x0) {
      uVar4 = extraout_var;
      if (local_14 != 0) {
        local_18 = FUN_00576800();
        *(undefined4 *)(local_14 + 0x68) = 0;
        in_stack_ffffffdc = (LPCRITICAL_SECTION)(local_14 + 0x78);
        EnterCriticalSection(in_stack_ffffffdc);
        local_8 = 0xffffffff;
        Unwind_00570ed1();
      }
      iVar3 = FUN_00570590(local_14,param_2,local_18);
      if (iVar3 == 0) {
        uVar4 = FUN_00570f3b(in_stack_ffffffdc,puVar2,uVar4);
        return uVar4;
      }
      (**(code **)*puVar2)(iVar3);
      FUN_005710d0(local_14,local_18,param_2);
      uVar1 = *(uint *)(param_2 + 0x14);
      *(uint *)(param_2 + 0x14) = uVar1 & 0xfffff7ff;
      *(uint *)(param_2 + 0x14) = uVar1 & 0xfffef7ff;
      *(uint *)(param_2 + 0x14) = uVar1 & 0xfffee7ff;
      *(uint *)(param_2 + 0x14) = uVar1 & 0xfffec7ff;
      *(uint *)(param_2 + 0x14) = uVar1 & 0xfffe47ff;
      uVar4 = FUN_00570c90(local_18);
      *param_3 = uVar4;
      goto LAB_00570f3d;
    }
  }
  local_18 = 0;
LAB_00570f3d:
  *unaff_FS_OFFSET = uStack_10;
  return local_18;
}
