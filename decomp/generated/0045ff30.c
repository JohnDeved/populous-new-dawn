/* Ghidra 12.1.3 pseudocode; entry 0045ff30; FUN_0045ff30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0045ff30(int param_1)

{
  short *psVar1;
  unit_struct *puVar2;
  int iVar3;
  int iVar4;
  uint uVar5;
  uint uVar6;
  bool bVar7;
  byte bStack_5;
  short local_4;
  short local_2;

  iVar3 = tribe_get_shaman(param_1);
  if ((((*(byte *)(param_1 + 0x597) & 1) == 0) || (iVar3 == 0)) ||
     ((iVar4 = FUN_004f25b0(iVar3), iVar4 == 0 && (*(char *)(param_1 + 0x474) != '\0')))) {
    bVar7 = false;
  }
  else {
    iVar4 = FUN_00462d40(param_1,2);
    bVar7 = iVar4 == 0;
  }
  if ((bVar7) && ((char)game_state.offset_counter_2 != '\0')) {
    switch(*(undefined1 *)(param_1 + 0x474)) {
    case 0:
      *(undefined1 *)(param_1 + 0x474) = 1;
      return;
    case 1:
      *(undefined1 *)(param_1 + 0x474) = 2;
      *(undefined2 *)(param_1 + 0x464) = 0;
      *(undefined2 *)(param_1 + 0x468) = 1;
      *(undefined2 *)(param_1 + 0x462) = 9;
      *(undefined2 *)(param_1 + 0x45e) = *(undefined2 *)(param_1 + 0x46e);
      return;
    case 2:
      psVar1 = (short *)(param_1 + 0x472);
      iVar4 = FUN_00460270(param_1,iVar3,3,4,param_1 + 0x470,psVar1);
      if (iVar4 == 0x14) {
        puVar2 = unit_land_array[*psVar1];
        if ((uint)(byte)unit_type_array_building[(byte)puVar2->unit_type].field31_0x20 ==
            (int)(char)puVar2->hut_people_inside) {
          if ((uint)*(ushort *)(iVar3 + 0x24) == (int)(short)puVar2->loc_3_x) {
            *(undefined1 *)(param_1 + 0x474) = 3;
            return;
          }
          remove_person_from_hut(puVar2,0);
        }
        *(undefined1 *)(param_1 + 0x474) = 3;
        if ((unit_type_related_1_ARRAY_005a6f78[*(byte *)(iVar3 + 0x2c)].field_0x1 & 8) != 0) {
          FUN_0043b180(iVar3,unit_land_array[*psVar1]);
          return;
        }
        *(undefined1 *)(param_1 + 0x474) = 0;
        return;
      }
      if (iVar4 == 2) {
        *(undefined1 *)(param_1 + 0x474) = 4;
        return;
      }
      break;
    case 3:
      if ((*(byte *)(iVar3 + 0xe) & 0x80) != 0) {
        *(undefined1 *)(param_1 + 0x474) = 7;
        return;
      }
      iVar3 = FUN_004f39f0(iVar3);
      if (iVar3 != 0) {
        *(undefined1 *)(param_1 + 0x474) = 0;
        return;
      }
      break;
    case 4:
      *(undefined1 *)(param_1 + 0x474) = 5;
      *(undefined2 *)(param_1 + 0x464) = 0;
      return;
    case 5:
      iVar3 = FUN_00460420(param_1,iVar3,3);
      if (iVar3 == 0x16) {
        *(undefined1 *)(param_1 + 0x474) = 6;
        return;
      }
      if (iVar3 == 2) {
        *(undefined1 *)(param_1 + 0x474) = 0;
        return;
      }
      break;
    case 6:
      bStack_5 = (byte)(*(ushort *)(param_1 + 0x470) >> 8) & 0xfe;
      local_4 = ((*(ushort *)(param_1 + 0x470) & 0xfe) + 1) * 0x100;
      local_2 = (bStack_5 + 1) * 0x100;
      uVar5 = (int)*(short *)(iVar3 + 0x3d) - (int)local_4;
      uVar6 = (int)uVar5 >> 0x1f;
      iVar4 = (uVar5 ^ uVar6) - uVar6;
      if (0x7fff < iVar4) {
        iVar4 = 0xffff - iVar4;
      }
      if (iVar4 < 0x400) {
        uVar5 = (int)*(short *)(iVar3 + 0x3f) - (int)local_2;
        uVar6 = (int)uVar5 >> 0x1f;
        iVar4 = (uVar5 ^ uVar6) - uVar6;
        if (0x7fff < iVar4) {
          iVar4 = 0xffff - iVar4;
        }
        if (iVar4 < 0x400) {
          *(undefined1 *)(param_1 + 0x474) = 7;
          return;
        }
      }
      iVar3 = FUN_0043b2a0(iVar3,&local_4);
      if (iVar3 == 0) {
        *(undefined1 *)(param_1 + 0x474) = 0;
        return;
      }
      break;
    case 7:
      *(undefined2 *)(param_1 + 0x468) = 9;
      *(undefined2 *)(param_1 + 0x462) = 0x51;
      *(undefined2 *)(param_1 + 0x45e) = *(undefined2 *)(param_1 + 0x46e);
      return;
    }
  }
  else {
    *(undefined1 *)(param_1 + 0x474) = 0;
  }
  return;
}
