/* Ghidra 12.1.3 pseudocode; entry 004369f0; FUN_004369f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004369f0(int param_1,byte *param_2,uint *param_3)

{
  int iVar1;
  ushort uVar2;
  unit_struct *puVar3;
  char cVar4;
  char cVar5;
  uint uVar6;
  uint uVar7;
  unit_struct *puVar8;
  int iVar9;
  uint uVar10;

  cVar4 = '\0';
  iVar9 = 8;
  if (*(ushort *)(param_1 + 0x9b) != 0) {
    iVar1 = (uint)*(ushort *)(param_1 + 0x9b) * 10;
    if ((*(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 1) & 1) == 0) {
      *param_2 = *(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1);
      uVar7 = (uint)*(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1);
      uVar6 = (uint)*(ushort *)(&DAT_005a7db9 + uVar7 * 0x16);
      if (uVar7 == 7) {
        if ((*(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 1) & 8) != 0) {
          uVar6 = 0x25;
        }
      }
      else if (uVar7 == 0x16) {
        puVar8 = (unit_struct *)0x0;
        if (((*(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6) != 0) &&
            (puVar3 = unit_land_array
                      [*(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6)],
            (*(byte *)&puVar3->flags_2 & 1) == 0)) && (puVar3->unit_class != '\0')) {
          puVar8 = puVar3;
        }
        if (((puVar8 != (unit_struct *)0x0) && (puVar8->unit_class == '\x04')) &&
           ((puVar8->unit_type == '\x01' || (puVar8->unit_type == '\x02')))) {
          uVar6 = 0x20;
        }
      }
      cVar4 = '\x01';
      iVar9 = 7;
      *param_3 = uVar6;
    }
  }
  uVar7 = (uint)*(byte *)(param_1 + 0xa6);
  for (; iVar9 != 0; iVar9 = iVar9 + -1) {
    if (7 < (int)uVar7) {
      uVar7 = 0;
    }
    uVar2 = *(ushort *)(param_1 + 0x8b + uVar7 * 2);
    cVar5 = cVar4;
    if (uVar2 != 0) {
      iVar1 = (uint)uVar2 * 10;
      if ((*(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 1) & 1) == 0) {
        param_2[cVar4] = *(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1);
        uVar6 = (uint)*(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1);
        uVar10 = (uint)*(ushort *)(&DAT_005a7db9 + uVar6 * 0x16);
        if (uVar6 == 7) {
          if ((*(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 1) & 8) != 0) {
            uVar10 = 0x25;
          }
        }
        else if (uVar6 == 0x16) {
          puVar8 = (unit_struct *)0x0;
          if (((*(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6) != 0) &&
              (puVar3 = unit_land_array
                        [*(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6)],
              (*(byte *)&puVar3->flags_2 & 1) == 0)) && (puVar3->unit_class != '\0')) {
            puVar8 = puVar3;
          }
          if (((puVar8 != (unit_struct *)0x0) && (puVar8->unit_class == '\x04')) &&
             ((puVar8->unit_type == '\x01' || (puVar8->unit_type == '\x02')))) {
            uVar10 = 0x20;
          }
        }
        cVar5 = cVar4 + '\x01';
        param_3[cVar4] = uVar10;
      }
    }
    uVar7 = uVar7 + 1;
    cVar4 = cVar5;
  }
  return;
}
