/* Ghidra 12.1.3 pseudocode; entry 0048b950; init_hw_sound.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void init_hw_sound(void)

{
  int *piVar1;
  int iVar2;
  undefined4 uVar3;
  undefined *puVar4;
  undefined4 *unaff_FS_OFFSET;
  undefined1 local_260 [152];
  undefined1 local_1c8 [256];
  undefined4 local_c8 [2];
  uint local_c0;
  undefined1 local_30 [28];
  void *local_14;
  undefined4 local_10;
  undefined1 *puStack_c;
  int local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_0048bc7b;
  *unaff_FS_OFFSET = &local_10;
  FUN_0056e070();
  FUN_0056e730();
  local_8 = 0;
  DAT_0089ce6d = 0;
  local_14 = operator_new(0x34);
  local_8._0_1_ = 1;
  piVar1 = (int *)0x0;
  if (local_14 != (void *)0x0) {
    piVar1 = (int *)FUN_0056ce60();
  }
  local_8 = (uint)local_8._1_3_ << 8;
  sound_related = piVar1;
  if (piVar1 != (int *)0x0) {
    local_c8[0] = 0xf;
    local_c0 = local_c0 | 1;
    iVar2 = FUN_004998b0();
    if (iVar2 == 0) {
      local_c0 = local_c0 | 0x200;
    }
    else {
      local_c0 = local_c0 | 0x400;
    }
    FUN_0056e0d0(DAT_005e4bfc);
    iVar2 = (**(code **)(*sound_related + 0xc))(local_c8);
    if (iVar2 == 0) {
      DAT_00895daf = 1;
      DAT_00895dc0 = 1;
      iVar2 = FUN_004998b0();
      puVar4 = PTR_s_soundd2low_sdt_005ae2c8;
      if (iVar2 != 0) {
        puVar4 = PTR_s_soundd2_sdt_005ae2a0;
      }
      FUN_00500070(local_1c8,s_SOUND_005ae300,puVar4,0);
      uVar3 = FUN_0056e710(2,local_1c8,0);
      sound_related_3 = FUN_0056ddc0(uVar3);
      if (sound_related_3 != 0) {
        DAT_00895db2 = 1;
      }
      FUN_00500070(local_1c8,s_SOUND_005ae300,PTR_s_popdrones22_sdt_005ae2a8,0);
      uVar3 = FUN_0056e710(1,local_1c8,0);
      DAT_005ae2ac = FUN_0056ddc0(uVar3);
      if (DAT_005ae2ac != 0) {
        DAT_00895db3 = 1;
      }
      DAT_00895db6 = 1;
      FUN_00500070(local_1c8,s_SOUND_005ae300,PTR_s_popfight_sf2_005ae2b8,0);
      uVar3 = FUN_0056e710(4,local_1c8,0);
      _DAT_005ae2bc = FUN_0056ddc0(uVar3);
      if (_DAT_005ae2bc == 0) {
        DAT_00895db6 = 0;
        FUN_00500070(local_1c8,s_SOUND_005ae300,PTR_s_popfightnew_sdt_005ae2c0,0);
        uVar3 = FUN_0056e710(2,local_1c8,0);
        _DAT_005ae2bc = FUN_0056ddc0(uVar3);
      }
      iVar2 = DAT_005a8ae4;
      for (puVar4 = &DAT_005a8ab8;
          (iVar2 != 2 && (*(undefined1 **)(puVar4 + 0x20) != &DAT_00895dbf)); puVar4 = puVar4 + 0x34
          ) {
        iVar2 = *(int *)(puVar4 + 0x60);
      }
      if (*(int *)(puVar4 + 0x2c) != 2) {
        *(undefined4 *)(puVar4 + 5) = 1;
        DAT_00895dbf = 1;
        local_14 = operator_new(0x24);
        iVar2 = 0;
        local_8._0_1_ = 2;
        if (local_14 != (void *)0x0) {
          iVar2 = FUN_0056e120();
        }
        local_8 = (uint)local_8._1_3_ << 8;
        sound_related_2 = iVar2;
        if ((iVar2 == 0) || (iVar2 = FUN_0056e150(local_30), iVar2 != 0)) goto LAB_0048b9be;
        if (*(int *)(sound_related_2 + 4) != 0) {
          *(int *)(puVar4 + 5) = *(int *)(sound_related_2 + 4);
        }
      }
      FUN_0056ccf0();
      FUN_0056ce40(0x42);
      FUN_0056ce50(sound_related_3);
      FUN_0056ce30(0);
      iVar2 = *sound_related;
      uVar3 = (**(code **)(iVar2 + 0x18))(0,local_260);
      (**(code **)(iVar2 + 0x20))(uVar3);
    }
  }
LAB_0048b9be:
  local_8 = 0xffffffff;
  Unwind_0048bc85();
  *unaff_FS_OFFSET = local_10;
  return;
}
