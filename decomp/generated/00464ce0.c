/* Ghidra 12.1.3 pseudocode; entry 00464ce0; FUN_00464ce0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00464ce0(unit_struct *param_1,undefined4 *param_2,undefined4 *param_3)

{
  byte bVar1;
  unit_struct *puVar2;
  undefined1 uVar3;
  ushort uVar4;
  bool bVar5;
  bool bVar6;
  char cVar7;
  char cVar8;
  short sVar9;
  uint uVar10;
  uint uVar11;
  undefined1 uVar12;
  short sVar13;
  undefined1 local_1b;
  ushort local_18;
  undefined4 local_14;
  undefined4 local_c;
  undefined1 local_8 [4];
  undefined1 local_4 [4];

  local_1b = 0;
  local_c = *param_2;
  uVar3 = (undefined1)((uint)local_c >> 8);
  bVar5 = false;
  uVar12 = (undefined1)((uint)local_c >> 0x18);
  uVar4 = CONCAT11(uVar12,uVar3) & 0xfffe;
  uVar10 = (uVar4 & 0xfe) * 2 | uVar4 & 0xfe00;
  uVar11 = (&game_state.level_data[0].flags)[uVar10];
  if (((uVar11 & 0x200) == 0) && ((uVar11 & 4) == 0)) {
    bVar6 = true;
    for (puVar2 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar10 * 2]];
        puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
      if ((puVar2->unit_class == '\x04') && (puVar2 != param_1)) {
        bVar6 = false;
        break;
      }
    }
    if (bVar6) {
      bVar1 = *(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar10 * 4] & 0xf)
                       );
      if ((bVar1 & 0x3c) == 0) {
        if ((bVar1 & 2) != 0) {
          bVar5 = true;
        }
      }
      else if (((uVar11 & 0x1000000) != 0) && ((bVar1 & 0x10) == 0)) {
        bVar5 = true;
      }
    }
  }
  if (bVar5) {
    local_1b = 1;
  }
  else {
    cVar7 = get_empty_indexed_xy(2,0,0,0x10);
    if (cVar7 != '\0') {
      local_14 = (CONCAT11(uVar12,uVar3) & 0xfffe) & 0xfffffeff;
      do {
        cVar8 = get_indexed_xy(cVar7,local_8,local_4);
        if (cVar8 == '\0') goto LAB_00464f58;
        bVar5 = false;
        sVar9 = ((byte)(local_8[0] * '\x02' + (char)local_14) + 1) * 0x100;
        sVar13 = ((byte)(local_4[0] * '\x02' + local_14._1_1_) + 1) * 0x100;
        local_18 = CONCAT11((char)((ushort)sVar13 >> 8),(char)((ushort)sVar9 >> 8)) & 0xfefe;
        uVar11 = (local_18 & 0xfe) * 2 | local_18 & 0xfe00;
        if (((&game_state.level_data[0].flags)[uVar11] & 0x204) == 0) {
          bVar6 = true;
          for (puVar2 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar11 * 2]];
              puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
            if ((puVar2->unit_class == '\x04') && (param_1 != puVar2)) {
              bVar6 = false;
              break;
            }
          }
          if (bVar6) {
            bVar1 = *(byte *)(landscape_height_array +
                             ((&game_state.level_data[0].c_3)[uVar11 * 4] & 0xf));
            if ((bVar1 & 0x3c) == 0) {
              if ((bVar1 & 2) != 0) goto LAB_00464f37;
            }
            else if (((*(byte *)((int)&game_state.level_data[0].flags + uVar11 * 4 + 3) & 1) != 0)
                    && ((bVar1 & 0x10) == 0)) {
LAB_00464f37:
              bVar5 = true;
            }
          }
        }
      } while (!bVar5);
      local_1b = 1;
      local_14 = CONCAT22(sVar13,sVar9);
      local_c = local_14;
LAB_00464f58:
      clear_indexed_xy(cVar7);
    }
  }
  *param_3 = local_c;
  return local_1b;
}
