/* Ghidra 12.1.3 pseudocode; entry 0048b500; sound_func_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void sound_func_1(void)

{
  uint uVar1;
  uint uVar2;
  undefined4 uVar3;
  undefined4 *puVar4;
  int iVar5;
  undefined4 *puVar6;
  undefined *puVar7;
  undefined4 *unaff_FS_OFFSET;
  bool bVar8;
  undefined1 local_1c0 [256];
  undefined1 local_c0 [164];
  undefined4 *local_1c;
  uint local_18;
  uint local_14;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_0048b74d;
  *unaff_FS_OFFSET = &local_10;
  if (DAT_00895db1 == '\x01') {
    if ((DAT_00895dbb != (undefined4 *)0x0) || (DAT_00895db3 == '\0')) goto LAB_0048b834;
    uVar1 = pseudo_random * 0x24a1 + 0x24df;
    uVar2 = uVar1 >> 0xd;
    local_18 = uVar2 | uVar1 * 0x80000;
    DAT_00895dc0 = ((byte)uVar2 & 3) + 2;
    if (interface_state == '\a') {
      DAT_00895dc0 = '\x01';
    }
    uVar2 = local_18 * 0x24a1 + 0x24df;
    local_14 = uVar2 >> 0xd | uVar2 * 0x80000;
    pseudo_random = local_14;
    PTR_s_popdrum022_sdt_005ae2b0[7] = (char)((ulonglong)local_14 % 10) + '0';
    if (DAT_005ae2b4 != 0) {
      FUN_0056e000(&DAT_005ae2b4);
      DAT_005ae2b4 = 0;
    }
    FUN_00500070(local_1c0,s_SOUND_005ae300,PTR_s_popdrum022_sdt_005ae2b0,0);
    uVar3 = FUN_0056e710(2,local_1c0,0);
    DAT_005ae2b4 = FUN_0056ddc0(uVar3);
    if (DAT_005ae2b4 == 0) {
      bVar8 = false;
    }
    else {
      puVar4 = operator_new(0xc);
      local_8 = 0;
      puVar6 = (undefined4 *)0x0;
      local_1c = puVar4;
      if (puVar4 != (undefined4 *)0x0) {
        FUN_0056e6e0();
        *puVar4 = &PTR_FUN_0058f610;
        puVar4[1] = 0;
        *puVar4 = &PTR_LAB_0058f620;
        puVar4[2] = 0;
        puVar6 = puVar4;
      }
      local_8 = 0xffffffff;
      DAT_00895dbb = puVar6;
      if (puVar6 == (undefined4 *)0x0) {
        bVar8 = false;
      }
      else {
        iVar5 = FUN_0048c230(0);
        if (iVar5 == 0) {
          bVar8 = false;
        }
        else {
          DAT_00895db7 = iVar5;
          iVar5 = (**(code **)(*sound_related + 0x20))(iVar5);
          bVar8 = iVar5 == 0;
        }
      }
    }
    if (bVar8) {
      DAT_005ae2f0 = 1;
      FUN_0056ccf0();
      FUN_0056ce30(DAT_00895db5);
      if (DAT_005ae2f0 == 1) {
        if (DAT_00895db7 != 0) {
          (**(code **)(*sound_related + 0x14))(DAT_00895db7,local_c0);
        }
      }
      else if ((DAT_005ae2f0 == 2) && (sound_related_2 != 0)) {
        FUN_0056e3c0((uint)DAT_00895db5 << 9);
      }
      goto LAB_0048b834;
    }
  }
  else if (DAT_00895db1 == '\x02') {
    if ((interface_state == '\a') || (sound_related_2 == 0)) goto LAB_0048b834;
    iVar5 = DAT_005a8ae4;
    for (puVar7 = &DAT_005a8ab8; (iVar5 != 2 && (*(undefined1 **)(puVar7 + 0x20) != &DAT_00895dbf));
        puVar7 = puVar7 + 0x34) {
      iVar5 = *(int *)(puVar7 + 0x60);
    }
    if (*(int *)(puVar7 + 0x2c) == 2) goto LAB_0048b834;
    *(undefined4 *)(puVar7 + 5) = 1;
    iVar5 = *(int *)(sound_related_2 + 4);
    if (iVar5 == 0) goto LAB_0048b834;
    if (iVar5 < (int)(uint)DAT_00895dbf) {
      DAT_00895dbf = (byte)iVar5;
    }
    *(int *)(puVar7 + 5) = iVar5;
    if (sound_related_2 != 0) {
      FUN_0056e3c0((uint)DAT_00895db5 << 9);
    }
    if ((sound_related_2 != 0) && (iVar5 = FUN_0056e460(DAT_00895dbf), iVar5 == 0)) {
      DAT_005ae2f0 = 2;
      goto LAB_0048b834;
    }
  }
  DAT_005ae2f0 = 0;
LAB_0048b834:
  *unaff_FS_OFFSET = local_10;
  return;
}
