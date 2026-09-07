/* Ghidra 12.1.3 pseudocode; entry 00502090; set_landscape_pos_fields_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_landscape_pos_fields_2(byte param_1)

{
  byte *pbVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;
  byte bVar4;
  byte bVar5;
  byte bVar6;
  char cVar7;
  char cVar8;
  int iVar9;
  uint uVar10;
  unit_struct *puVar11;
  int iVar12;
  ushort *puVar13;
  byte local_24;
  byte local_23;
  ushort local_22;
  char local_20;
  char cStack_1f;
  undefined2 local_1e;
  int local_1c;
  undefined4 local_14;
  undefined4 local_10;
  unit_struct **local_c;
  uint local_8;
  byte local_4;

  iVar12 = 0x8a03e4;
  iVar9 = 0x4000;
  do {
    *(byte *)(iVar12 + 0xb) = *(byte *)(iVar12 + 0xb) & ~(param_1 << 4);
    *(byte *)(iVar12 + 0xf) = *(byte *)(iVar12 + 0xf) & ~param_1;
    *(byte *)(iVar12 + 0xc) = *(byte *)(iVar12 + 0xc) & ~(param_1 << 4);
    iVar12 = iVar12 + 0x10;
    iVar9 = iVar9 + -1;
  } while (iVar9 != 0);
  local_1c = 0;
  if (game_state.num_tribes != 0) {
    local_c = &game_state.tribes_array[0].building_units;
    local_8 = (uint)param_1;
    do {
      if ((local_8 & 1 << ((byte)local_1c & 0x1f)) != 0) {
        bVar6 = '\x01' << ((byte)local_1c + 4 & 0x1f);
        for (puVar2 = *local_c; puVar2 != (unit_struct *)0x0; puVar2 = puVar2->next_unit) {
          if (((puVar2->unit_type == '\x04') && (puVar2->hut_people_inside != '\0')) &&
             (iVar9 = FUN_0040b450(puVar2), iVar9 != 0)) {
            local_24 = 0;
            local_23 = 0;
            if ((puVar2->hut_people_inside != '\0') &&
               (unit_type_array_building[4].field31_0x20 != 0)) {
              puVar13 = &puVar2->loc_3_x;
              uVar10 = (uint)unit_type_array_building[4].field31_0x20;
              do {
                puVar11 = (unit_struct *)0x0;
                if (((*puVar13 != 0) &&
                    (puVar3 = unit_land_array[*puVar13], (puVar3->flags_2 & 1) == 0)) &&
                   (puVar3->unit_class != '\0')) {
                  puVar11 = puVar3;
                }
                bVar4 = local_24;
                if (((puVar11 != (unit_struct *)0x0) &&
                    (bVar4 = '\x01' << ((byte)local_1c & 0x1f), puVar11->unit_type != '\x05')) &&
                   (bVar4 = local_24, puVar11->unit_type == '\x03')) {
                  local_23 = bVar6;
                }
                local_24 = bVar4;
                puVar13 = puVar13 + 1;
                uVar10 = uVar10 - 1;
              } while (uVar10 != 0);
            }
            cVar7 = get_empty_indexed_xy(2,0,0,iVar9);
            if (cVar7 != '\0') {
              local_22 = CONCAT11((char)((ushort)(puVar2->pos).y >> 8),
                                  (char)((ushort)(puVar2->pos).x >> 8)) & 0xfefe;
              cVar8 = get_indexed_xy(cVar7,&local_10,&local_14);
              bVar5 = bVar6;
              bVar4 = local_4;
              while (local_4 = bVar5, cVar8 != '\0') {
                local_20 = (char)local_22;
                cStack_1f = (char)(local_22 >> 8);
                local_1e = CONCAT11((char)local_14 * '\x02' + cStack_1f,
                                    (char)local_10 * '\x02' + local_20);
                uVar10 = (local_1e & 0xfe) * 2 | local_1e & 0xfe00;
                pbVar1 = &game_state.level_data[0].c_2 + uVar10 * 4;
                *pbVar1 = *pbVar1 | local_4;
                iVar9 = uVar10 * 4;
                pbVar1 = &game_state.level_data[0].ph_2 + iVar9;
                *pbVar1 = *pbVar1 | local_24;
                pbVar1 = &game_state.level_data[0].c_3 + iVar9;
                *pbVar1 = *pbVar1 | local_23;
                cVar8 = get_indexed_xy(cVar7,&local_10,&local_14);
                bVar5 = local_4;
                bVar4 = local_4;
              }
              local_4 = bVar4;
              clear_indexed_xy(cVar7);
            }
          }
        }
      }
      local_1c = local_1c + 1;
      local_c = (unit_struct **)((int)local_c + 0xc65);
    } while (local_1c < (int)(uint)game_state.num_tribes);
  }
  return;
}
