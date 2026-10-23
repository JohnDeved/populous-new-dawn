/* Ghidra 12.1.3 pseudocode; entry 00437010; FUN_00437010.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00437010(char param_1)

{
  undefined1 *puVar1;
  int iVar2;
  byte bVar3;
  ushort uVar4;
  short sVar5;
  unit_struct *puVar6;
  unit_struct *puVar7;
  bool bVar8;
  uint uVar9;
  uint uVar10;
  char cVar11;
  int iVar12;
  uint uVar13;
  int iVar14;
  uint uVar15;
  unit_struct *puVar16;
  uint uVar17;
  uint uVar18;
  ushort *puVar19;
  undefined2 local_12;
  short local_10;

  uVar9 = DAT_00895e7a;
  uVar18 = _minimap_centre_x;
  iVar12 = (int)player_tribe_num;
  uVar17 = (uint)unit_index_1;
  bVar8 = false;
  uVar13 = (uint)unit_index_2;
  DAT_00895e7a = 0;
  DAT_00895e82 = 0;
  DAT_00895e86 = 0;
  if ((DAT_0098e908._1_1_ & 4) == 0) {
    if ((DAT_0098e908._1_1_ & 8) != 0) {
      if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) ||
         ((DAT_0098462e != '\0' && (DAT_0098472e == '\0')))) goto LAB_004370a7;
      goto LAB_004370b1;
    }
  }
  else {
LAB_004370a7:
    DAT_00895e7a = 0x100000;
LAB_004370b1:
    if (((DAT_0098e908._1_1_ & 8) != 0) &&
       (((DAT_009845ae != '\0' && (DAT_009846ae == '\0')) ||
        ((DAT_0098462e != '\0' && (DAT_0098472e == '\0')))))) {
      DAT_00895e7a = DAT_00895e7a | 0x1000;
      cVar11 = FUN_004b98f0(_minimap_centre_x,CONCAT11((char)(unit_index_2 >> 8),player_tribe_num),1
                           );
      if (cVar11 != '\0') {
        DAT_00895e7a = DAT_00895e7a | 0x800000;
      }
    }
  }
  uVar10 = DAT_00895e7a;
  local_10 = (short)uVar18;
  if (DAT_0089d15f == '\0') {
    if ((uVar18 & 0x10000) == 0) {
      DAT_0089d15f = '\0';
      goto LAB_0043712a;
    }
  }
  else {
    DAT_0089d15f = DAT_0089d15f + -1;
LAB_0043712a:
    if ((uVar18 & 0x10000) == 0) goto LAB_004374d5;
  }
  DAT_00895e7a = DAT_00895e7a | 1;
  uVar15 = (uVar18 & 0xfe) * 2 | uVar18 & 0xfe00;
  uVar18 = (&game_state.level_data[0].flags)[uVar15];
  if ((uVar18 & 0x400) == 0) {
    if ((uVar18 & 0x200) != 0) {
      uVar18 = (ushort)(&game_state.level_data[0].unit_index_2)[uVar15 * 2] & 0x3ff;
      puVar7 = unit_land_array[uVar18];
      if (((byte)puVar7->unit_type < 0x12) || (0x13 < (byte)puVar7->unit_type)) {
        if ((*(ushort *)&puVar7->field_0x9c & 0x8000) != 0) {
          DAT_00895e7a = uVar10 | 0x8001;
        }
        uVar18 = (uint)(byte)puVar7->state;
        if (uVar18 == 1) {
          uVar4 = puVar7->loc_2_y;
          uVar18 = (uint)uVar4;
          puVar16 = (unit_struct *)0x0;
          if (((uVar4 != 0) &&
              (puVar6 = unit_land_array[uVar4], (*(byte *)&puVar6->flags_2 & 1) == 0)) &&
             (puVar6->unit_class != '\0')) {
            puVar16 = puVar6;
          }
          if (puVar16 != (unit_struct *)0x0) {
            DAT_00895e82 = (uint)(short)uVar4;
            DAT_00895e7a = DAT_00895e7a | 0x42;
            cVar11 = puVar16->tribe_index;
            uVar18 = CONCAT31((int3)(char)(uVar4 >> 8),player_tribe_num);
            goto joined_r0x0043726f;
          }
        }
        else if (uVar18 == 2) {
          DAT_00895e7a = DAT_00895e7a | 0x30;
          DAT_00895e82 = (ushort)(&game_state.level_data[0].unit_index_2)[uVar15 * 2] & 0x3ff;
          cVar11 = puVar7->tribe_index;
          uVar18 = DAT_00895e82;
joined_r0x0043726f:
          bVar8 = true;
          if (cVar11 == player_tribe_num) {
            bVar8 = true;
            DAT_00895e7a = DAT_00895e7a | 0x80;
          }
        }
        cVar11 = FUN_0043d7d0(puVar7,CONCAT31((int3)(uVar18 >> 8),player_tribe_num));
        if (cVar11 != '\0') {
          DAT_00895e7a = DAT_00895e7a | 0x10000;
        }
      }
      else {
        bVar8 = true;
        DAT_00895e7a = uVar10 | 0x11;
        if (puVar7->unit_type == '\x12') {
          DAT_00895e7a = uVar10 | 0x80011;
        }
        DAT_00895e82 = uVar18;
        if (puVar7->unit_type == '\x13') {
          DAT_00895e7a = DAT_00895e7a | 0x200000;
        }
      }
    }
  }
  else {
    bVar8 = true;
    DAT_00895e82 = (ushort)(&game_state.level_data[0].unit_index_2)[uVar15 * 2] & 0x3ff;
    DAT_00895e7a = uVar10 | 3;
    if (unit_land_array[DAT_00895e82]->tribe_index == player_tribe_num) {
      DAT_00895e7a = uVar10 | 0x83;
    }
    cVar11 = FUN_0043d7d0(unit_land_array[DAT_00895e82],
                          CONCAT31((int3)(DAT_00895e82 >> 8),player_tribe_num));
    if (cVar11 != '\0') {
      DAT_00895e7a = DAT_00895e7a | 0x10000;
    }
  }
  if ((!bVar8) && (sVar5 = (&game_state.level_data[0].unit_index)[uVar15 * 2], sVar5 != 0)) {
    for (puVar7 = unit_land_array[sVar5]; puVar7 != (unit_struct *)0x0;
        puVar7 = unit_land_array[puVar7->next_unit_index]) {
      if (puVar7->unit_class == '\x01') {
        if (((puVar7->tribe_index != -1) && (player_tribe_num != puVar7->tribe_index)) &&
           ((iVar14 = FUN_004de7b0(puVar7,(int)player_tribe_num), iVar14 == 0 &&
            (puVar7->field36_0x5f == 0)))) {
          DAT_00895e7a = DAT_00895e7a | 0x100;
        }
      }
      else if (puVar7->unit_class == '\x05') {
        bVar3 = puVar7->unit_type;
        if ((unit_type_array_scenery[bVar3].flags_1 & 4) == 0) {
          if ((bVar3 == 0xe) && (*(char *)&puVar7->loc_3_y == '\x01')) {
            DAT_00895e82 = (uint)(ushort)puVar7->unit_index;
            DAT_00895e7a = DAT_00895e7a | 0x200;
          }
          else if (bVar3 == 9) {
            local_12 = CONCAT11((char)((ushort)(puVar7->pos).y >> 8),
                                (char)((ushort)(puVar7->pos).x >> 8));
            for (puVar16 = unit_land_array
                           [(short)(&game_state.level_data[0].unit_index)
                                   [((local_12 & 0xfe) * 2 | local_12 & 0xfe00) * 2]];
                puVar16 != (unit_struct *)0x0; puVar16 = unit_land_array[puVar16->next_unit_index])
            {
              if (((puVar16->unit_class == '\x06') && (puVar16->unit_type == '\x06')) &&
                 ((puVar16->field_0x6d & 1) != 0)) {
                DAT_00895e82 = (uint)(ushort)puVar7->unit_index;
                DAT_00895e7a = DAT_00895e7a | 0x800;
              }
            }
          }
        }
        else {
          DAT_00895e82 = (uint)(ushort)puVar7->unit_index;
          DAT_00895e7a = DAT_00895e7a | 0x18;
        }
      }
    }
  }
  sVar5 = (&game_state.level_data[0].unit_index)[uVar15 * 2];
  if (sVar5 != 0) {
    for (puVar7 = unit_land_array[sVar5]; puVar7 != (unit_struct *)0x0;
        puVar7 = unit_land_array[puVar7->next_unit_index]) {
      if ((puVar7->unit_class == '\n') && (puVar7->unit_type == '\x10')) {
        DAT_00895e82 = (uint)(ushort)puVar7->unit_index;
        DAT_00895e7a = DAT_00895e7a | 0x801000;
      }
    }
  }
LAB_004374d5:
  if (uVar13 != 0) {
    puVar7 = unit_land_array[uVar13];
    if (puVar7->unit_class == '\x05') {
      if ((unit_type_array_scenery[(byte)puVar7->unit_type].flags_1 & 4) != 0) {
        DAT_00895e7a = DAT_00895e7a | 8;
        DAT_00895e86 = uVar13;
      }
    }
    else if ((puVar7->unit_class == '\x04') && (cVar11 = FUN_00465650(puVar7), cVar11 != '\0')) {
      DAT_00895e82 = (uint)(ushort)puVar7->unit_index;
      DAT_00895e7a = DAT_00895e7a | 0x410;
    }
  }
  uVar18 = DAT_00895e7a;
  if (uVar17 != 0) {
    puVar7 = unit_land_array[uVar17];
    cVar11 = puVar7->unit_class;
    if (cVar11 == '\x01') {
      cVar11 = puVar7->tribe_index;
      if ((cVar11 == -1) || (player_tribe_num == cVar11)) {
        if ((puVar7->unit_type == '\a') && (player_tribe_num == cVar11)) {
          DAT_00895e7a = DAT_00895e7a | 0x40000;
          DAT_00895e86 = uVar17;
        }
      }
      else {
        DAT_00895e7a = DAT_00895e7a | 4;
        if ((((DAT_0098e908._1_1_ & 4) != 0) || (puVar7->unit_type == '\a')) ||
           (DAT_00895e86 = uVar17, puVar7->unit_type == '\x04')) {
          DAT_00895e7a = uVar18 | 0x1000004;
          DAT_00895e86 = uVar17;
        }
      }
    }
    else if (cVar11 == '\x05') {
      if ((unit_type_array_scenery[(byte)puVar7->unit_type].flags_1 & 4) != 0) {
        DAT_00895e7a = DAT_00895e7a | 8;
        DAT_00895e86 = uVar17;
      }
    }
    else if (((cVar11 == '\x06') && (puVar7->unit_type == '\x02')) &&
            (cVar11 = FUN_004fb180(puVar7), cVar11 != '\0')) {
      DAT_00895e7a = DAT_00895e7a | 0x20000;
      DAT_00895e86 = uVar17;
    }
  }
  if (DAT_005cae80 != -1) {
    DAT_00895e7a = DAT_00895e7a | 0x2000;
    DAT_00895e9c = '\x01';
  }
  if (DAT_005cae74 != '\0') {
    DAT_00895e7a = DAT_00895e7a | 0x400000;
    DAT_00895e9c = '\x01';
  }
  if ((DAT_00895e8e != local_10) || (DAT_00895e7a != uVar9)) {
    DAT_00895e9c = '\x01';
  }
  DAT_00895e8e = local_10;
  if ((DAT_00895e9c != '\0') && (param_1 != '\0')) {
    game_state.tribes_array[iVar12].field_0xc23 = 0;
    uVar18 = *(uint *)&game_state.tribes_array[iVar12].field_0x93d;
    *(uint *)&game_state.tribes_array[iVar12].field_0x93d = uVar18 | 4;
    *(uint *)&game_state.tribes_array[iVar12].field_0x93d = uVar18 & 0xffffffbf | 4;
    for (puVar7 = game_state.tribes_array[iVar12].person_units; puVar7 != (unit_struct *)0x0;
        puVar7 = puVar7->next_unit) {
      if ((*(byte *)&puVar7->loc_1_x & 0x80) != 0) {
        puVar1 = &game_state.tribes_array[iVar12].field_0xc23;
        *puVar1 = *puVar1 | '\x01' << (puVar7->unit_type & 0x1f);
        if ((*(byte *)((int)&puVar7->flags_4 + 1) & 8) == 0) {
          puVar1 = &game_state.tribes_array[iVar12].field_0x93d;
          *(uint *)puVar1 = *(uint *)puVar1 & 0xfffffffb;
        }
        if (puVar7->unit_land_array_index == 0) {
          bVar8 = false;
          iVar14 = 0;
          puVar19 = (ushort *)((int)&puVar7->loc_3_z + 1);
          do {
            if (*puVar19 != 0) {
              iVar2 = (uint)*puVar19 * 10;
              if ((((char *)((int)(game_state.sunlight_array + 0x32) + iVar2) != (char *)0x0) &&
                  ((*(byte *)((int)(game_state.sunlight_array + 0x32) + iVar2 + 1) & 1) == 0)) &&
                 (*(char *)((int)(game_state.sunlight_array + 0x32) + iVar2) == '\x16')) {
                bVar8 = true;
                break;
              }
            }
            puVar19 = puVar19 + 1;
            iVar14 = iVar14 + 1;
          } while (iVar14 < 8);
          if (!bVar8) goto LAB_00437706;
        }
        puVar1 = &game_state.tribes_array[iVar12].field_0x93d;
        *(uint *)puVar1 = *(uint *)puVar1 | 0x40;
      }
LAB_00437706:
    }
    FUN_00437750();
    DAT_00895e9c = '\0';
  }
  if (*(char *)((int)&DAT_00895ea0 + (uint)DAT_00895e9d) == '\x10') {
    load_level_flags = load_level_flags | 0x10;
  }
  else {
    load_level_flags = load_level_flags & 0xffffffef;
  }
  FUN_004380f0();
  DAT_00895e98 = FUN_0047beb0();
  return;
}
