/* Ghidra 12.1.3 pseudocode; entry 004ecac0; init_tribe_struct.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void init_tribe_struct(void)

{
  undefined1 *puVar1;
  int *piVar2;
  char *pcVar3;
  char cVar4;
  short sVar5;
  short sVar6;
  unit_struct *puVar7;
  unit_struct *puVar8;
  int iVar9;
  int iVar10;
  uint uVar11;
  unit_struct *puVar12;
  int iVar13;
  ushort *puVar14;
  short *psVar15;
  int *piVar16;
  short *psVar17;
  undefined4 *puVar18;
  short local_28;
  short local_26;
  int local_24;
  int local_20;
  int local_1c;
  uint local_18;
  int local_14;
  int local_10 [4];

  local_20 = 0;
  if (((game_state.level_flags & 0x20) == 0) && ((DAT_005aa44c & game_state.offset_counter_2) == 0))
  {
    local_20 = 1;
  }
  iVar9 = (int)player_tribe_num;
  if ((game_state.tribes_array[iVar9].field_0x93d & 0x80) != 0) {
    local_1c = 0x2400000;
    local_28 = game_state.tribes_array[iVar9].x;
    local_26 = game_state.tribes_array[iVar9].y;
  }
  puVar18 = &DAT_00890338;
  for (iVar9 = 8; iVar9 != 0; iVar9 = iVar9 + -1) {
    *puVar18 = 0;
    puVar18 = puVar18 + 1;
  }
  wild_units = (unit_struct *)0x0;
  fight_units = (unit_struct *)0x0;
  pre_fight_units = (unit_struct *)0x0;
  local_10[0] = 0;
  guard_control_units = (unit_struct *)0x0;
  local_10[1] = 0;
  airship_units = (unit_struct *)0x0;
  local_10[2] = 0;
  boat_units = (unit_struct *)0x0;
  local_10[3] = 0;
  trigger_units = (unit_struct *)0x0;
  head_units = (unit_struct *)0x0;
  swamp_effect_units = (unit_struct *)0x0;
  DAT_0089bc76 = 0;
  _DAT_0089bc7a = 0;
  iVar13 = 4;
  DAT_0089bc7e = 0;
  DAT_0089bc82 = 0;
  PTR_008922e8 = (unit_struct *)0x0;
  iVar9 = 0x89d1c8;
  do {
    *(undefined4 *)(iVar9 + 0x92d) = 0;
    *(undefined4 *)(iVar9 + 0x931) = 0;
    *(undefined4 *)(iVar9 + 0x91d) = 0;
    *(undefined4 *)(iVar9 + 0x9ed) = 0;
    *(undefined4 *)(iVar9 + 0x925) = 0;
    *(undefined4 *)(iVar9 + 0x929) = 0;
    *(undefined4 *)(iVar9 + 0x935) = 0;
    *(undefined4 *)(iVar9 + 0x939) = 0;
    *(undefined4 *)(iVar9 + 0x881) = 0;
    *(undefined4 *)(iVar9 + 0x889) = 0;
    *(undefined4 *)(iVar9 + 0x885) = 0;
    *(undefined4 *)(iVar9 + 0x88d) = 0;
    *(undefined4 *)(iVar9 + 0x891) = 0;
    *(undefined4 *)(iVar9 + 0x895) = 0;
    *(undefined4 *)(iVar9 + 0x899) = 0;
    *(undefined4 *)(iVar9 + 0x89d) = 0;
    *(uint *)(iVar9 + 0x93d) = *(uint *)(iVar9 + 0x93d) & 0xffffbfff;
    uVar11 = *(uint *)(iVar9 + 0x941);
    *(uint *)(iVar9 + 0x941) = uVar11 & 0xfffffeff;
    *(uint *)(iVar9 + 0x941) = uVar11 & 0xfffffcff;
    *(undefined4 *)(iVar9 + 0xa27) = 0;
    *(undefined4 *)(iVar9 + 0xa2b) = 0;
    *(undefined4 *)(iVar9 + 0xa2f) = 0;
    *(undefined4 *)(iVar9 + 0xa33) = 0;
    *(undefined2 *)(iVar9 + 0xa37) = 0;
    *(undefined4 *)(iVar9 + 0xa39) = 0;
    *(undefined4 *)(iVar9 + 0xa3d) = 0;
    *(undefined4 *)(iVar9 + 0xa41) = 0;
    *(undefined4 *)(iVar9 + 0xa45) = 0;
    *(undefined2 *)(iVar9 + 0xa49) = 0;
    puVar18 = (undefined4 *)(iVar9 + 0xa4b);
    for (iVar10 = 0x16; iVar10 != 0; iVar10 = iVar10 + -1) {
      *puVar18 = 0;
      puVar18 = puVar18 + 1;
    }
    *(undefined2 *)puVar18 = 0;
    puVar18 = (undefined4 *)(iVar9 + 0xaa5);
    for (iVar10 = 0x1b; iVar10 != 0; iVar10 = iVar10 + -1) {
      *puVar18 = 0;
      puVar18 = puVar18 + 1;
    }
    puVar18 = (undefined4 *)(iVar9 + 0xb11);
    for (iVar10 = 0x1b; iVar10 != 0; iVar10 = iVar10 + -1) {
      *puVar18 = 0;
      puVar18 = puVar18 + 1;
    }
    puVar18 = (undefined4 *)(iVar9 + 0xb7d);
    for (iVar10 = 10; iVar10 != 0; iVar10 = iVar10 + -1) {
      *puVar18 = 0;
      puVar18 = puVar18 + 1;
    }
    *(undefined4 *)(iVar9 + 0xba5) = 0;
    *(undefined4 *)(iVar9 + 0xba9) = 0;
    *(undefined2 *)(iVar9 + 0xbad) = 0;
    puVar18 = (undefined4 *)(iVar9 + 0xbaf);
    for (iVar10 = 10; iVar10 != 0; iVar10 = iVar10 + -1) {
      *puVar18 = 0;
      puVar18 = puVar18 + 1;
    }
    *(undefined4 *)(iVar9 + 0xbd7) = 0;
    *(undefined4 *)(iVar9 + 0xbdb) = 0;
    iVar13 = iVar13 + -1;
    *(undefined4 *)(iVar9 + 0xbdf) = 0;
    *(undefined4 *)(iVar9 + 0xbe3) = 0;
    *(undefined2 *)(iVar9 + 0xbe7) = 0;
    *(undefined4 *)(iVar9 + 0xbe9) = 0;
    *(undefined4 *)(iVar9 + 0xbed) = 0;
    *(undefined4 *)(iVar9 + 0xbf1) = 0;
    *(undefined4 *)(iVar9 + 0xbf5) = 0;
    *(undefined2 *)(iVar9 + 0xbf9) = 0;
    *(undefined4 *)(iVar9 + 0xbfb) = 0;
    *(undefined4 *)(iVar9 + 0xbff) = 0;
    *(undefined4 *)(iVar9 + 0xc03) = 0;
    *(undefined4 *)(iVar9 + 0xc07) = 0;
    *(undefined2 *)(iVar9 + 0xc0b) = 0;
    *(undefined4 *)(iVar9 + 0xc0d) = 0;
    *(undefined4 *)(iVar9 + 0xc11) = 0;
    *(undefined4 *)(iVar9 + 0xc15) = 0;
    *(undefined4 *)(iVar9 + 0xc19) = 0;
    *(undefined2 *)(iVar9 + 0xc1d) = 0;
    iVar9 = iVar9 + 0xc65;
    puVar8 = allocated_units;
  } while (iVar13 != 0);
  for (; puVar12 = allocated_units_2, puVar8 != (unit_struct *)0x0; puVar8 = puVar8->next_unit_1) {
    puVar14 = &(puVar8->object).flags;
    *puVar14 = *puVar14 & 0xfffe;
    puVar12 = PTR_008922e8;
    if ((*(byte *)((int)&puVar8->flags_4 + 3) & 0x20) != 0) {
      switch(puVar8->unit_class) {
      case 1:
        if (puVar8->unit_type == '\x01') {
          puVar8->next_unit = wild_units;
          DAT_0089bc76 = DAT_0089bc76 + 1;
          wild_units = puVar8;
          puVar12 = PTR_008922e8;
          if (puVar8->state == ' ') {
            puVar1 = &game_state.tribes_array[*(byte *)((int)&puVar8->loc_2_z + 1)].field_0x939;
            *(int *)puVar1 = *(int *)puVar1 + 1;
            puVar12 = PTR_008922e8;
          }
        }
        else if (puVar8->unit_type == '\b') {
          puVar1 = &game_state.tribes_array[(char)puVar8->tribe_index].field_0xa37;
          *(short *)puVar1 = *(short *)puVar1 + 1;
          puVar12 = PTR_008922e8;
        }
        else {
          iVar13 = (int)(char)puVar8->tribe_index;
          iVar9 = iVar13 * 0xc65;
          puVar8->next_unit = game_state.tribes_array[iVar13].person_units;
          game_state.tribes_array[iVar13].person_units = puVar8;
          if (puVar8->state == '\x0e') {
            puVar1 = &game_state.tribes_array[iVar13].field_0x92d;
            *(int *)puVar1 = *(int *)puVar1 + 1;
          }
          psVar17 = (short *)(iVar9 + 0x89dc13 + (uint)(byte)puVar8->state * 2);
          *psVar17 = *psVar17 + 1;
          if ((puVar8->obj_index_anim_prev_2 & 4) != 0) {
            puVar1 = &game_state.tribes_array[iVar13].field_0x93d;
            *(uint *)puVar1 = *(uint *)puVar1 | 0x4000;
          }
          if ((*(byte *)&puVar8->loc_1_x & 0x80) != 0) {
            puVar1 = &game_state.tribes_array[iVar13].field_0x931;
            *(int *)puVar1 = *(int *)puVar1 + 1;
          }
          if ((*(byte *)((int)&puVar8->flags_4 + 1) & 8) == 0) {
            iVar10 = game_state.tribes_array[iVar13].num_persons + 1;
            game_state.tribes_array[iVar13].num_persons = iVar10;
            if (199 < iVar10) {
              FUN_00499d90(0x1000000,0x24f);
            }
            psVar17 = (short *)(iVar9 + 0x89dbef + (uint)(byte)puVar8->unit_type * 2);
            *psVar17 = *psVar17 + 1;
            if (local_20 != 0) {
              get_unit_mana(puVar8,&local_14);
              local_10[(char)puVar8->tribe_index] = local_10[(char)puVar8->tribe_index] + local_14;
            }
            if (puVar8->unit_type == '\a') {
              game_state.tribes_array[iVar13].shaman = puVar8;
            }
            puVar12 = PTR_008922e8;
            if (puVar8->tribe_index == player_tribe_num) {
              iVar10 = FUN_004513e0(puVar8);
              psVar17 = (short *)(iVar9 + 0x89dc6d +
                                 (iVar10 + (uint)(byte)puVar8->unit_type * 6) * 2);
              *psVar17 = *psVar17 + 1;
              if ((*(byte *)&puVar8->loc_1_x & 0x80) != 0) {
                psVar17 = (short *)(iVar9 + 0x89dc6f + (uint)(byte)puVar8->unit_type * 0xc);
                *psVar17 = *psVar17 + 1;
              }
              puVar12 = PTR_008922e8;
              if (((game_state.tribes_array[iVar13].field_0x93d & 0x80) != 0) &&
                 (iVar13 = calc_squared_distance_toroidal(&puVar8->pos,&local_28),
                 puVar12 = PTR_008922e8, iVar13 < local_1c)) {
                psVar17 = (short *)(iVar9 + 0x89dcd9 +
                                   (iVar10 + (uint)(byte)puVar8->unit_type * 6) * 2);
                *psVar17 = *psVar17 + 1;
                psVar17 = (short *)(iVar9 + 0x89dc01 + (uint)(byte)puVar8->unit_type * 2);
                *psVar17 = *psVar17 + 1;
                puVar12 = PTR_008922e8;
                if ((*(byte *)&puVar8->loc_1_x & 0x80) != 0) {
                  psVar17 = (short *)(iVar9 + 0x89dcdb + (uint)(byte)puVar8->unit_type * 0xc);
                  *psVar17 = *psVar17 + 1;
                  puVar12 = PTR_008922e8;
                }
              }
            }
          }
          else {
            piVar16 = game_state.tribes_array[iVar13].field1414_0x969 + 0x21;
            *piVar16 = *piVar16 + 1;
            puVar12 = PTR_008922e8;
          }
        }
        break;
      case 2:
        if (puVar8->unit_type == '\x12') {
          puVar8->next_unit = guard_control_units;
          guard_control_units = puVar8;
          puVar12 = PTR_008922e8;
        }
        else {
          puVar12 = puVar8;
          if (puVar8->unit_type != '\x13') {
            iVar9 = (int)(char)puVar8->tribe_index;
            puVar8->next_unit = game_state.tribes_array[iVar9].building_units;
            game_state.tribes_array[iVar9].building_units = puVar8;
            if (puVar8->state == '\x02') {
              psVar17 = (short *)(iVar9 * 0xc65 + 0x89dd45 + (uint)(byte)puVar8->unit_type * 2);
              *psVar17 = *psVar17 + 1;
            }
            psVar17 = (short *)(iVar9 * 0xc65 + 0x89dd77 + (uint)(byte)puVar8->unit_type * 2);
            *psVar17 = *psVar17 + 1;
            puVar18 = &game_state.tribes_array[iVar9].buildings_num;
            *puVar18 = *puVar18 + 1;
            puVar12 = PTR_008922e8;
          }
        }
        break;
      case 3:
        puVar8->next_unit = (unit_struct *)(&DAT_00890338)[(byte)puVar8->unit_type];
        (&DAT_00890338)[(byte)puVar8->unit_type] = puVar8;
        puVar12 = PTR_008922e8;
        break;
      case 4:
        uVar11 = (uint)(byte)puVar8->field_0xa1;
        psVar17 = (short *)(uVar11 * 0xc65 + 0x89dd6d + (uint)(byte)puVar8->unit_type * 2);
        *psVar17 = *psVar17 + 1;
        if ((puVar8->unit_type == 0) || (2 < (byte)puVar8->unit_type)) {
          DAT_0089bc82 = DAT_0089bc82 + 1;
          puVar8->next_unit = airship_units;
          puVar1 = &game_state.tribes_array[uVar11].field_0x941;
          airship_units = puVar8;
          *(uint *)puVar1 = *(uint *)puVar1 | 0x200;
        }
        else {
          DAT_0089bc7e = DAT_0089bc7e + 1;
          puVar8->next_unit = boat_units;
          puVar1 = &game_state.tribes_array[uVar11].field_0x941;
          boat_units = puVar8;
          *(uint *)puVar1 = *(uint *)puVar1 | 0x100;
        }
        puVar12 = PTR_008922e8;
        if ((puVar8->field_0x9e != '\0') &&
           ((uint)(byte)puVar8->field_0xa1 == (int)player_tribe_num)) {
          if ((unit_type_array_vehicle[(byte)puVar8->unit_type].field_0x15 & 1) == 0) {
            psVar17 = (short *)&game_state.tribes_array[uVar11].field_0xbd7;
            psVar15 = (short *)&game_state.tribes_array[uVar11].field_0xbe9;
          }
          else {
            psVar17 = (short *)&game_state.tribes_array[uVar11].field_0xbfb;
            psVar15 = (short *)&game_state.tribes_array[uVar11].field_0xc0d;
          }
          if (((game_state.tribes_array[uVar11].field_0x93d & 0x80) == 0) ||
             (iVar9 = calc_squared_distance_toroidal(&puVar8->pos,&local_28), local_1c <= iVar9)) {
            local_24 = 0;
          }
          else {
            local_24 = 1;
          }
          local_18 = 0;
          iVar9 = (int)(char)unit_type_array_vehicle[(byte)puVar8->unit_type].field_0x8;
          if (0 < iVar9) {
            puVar14 = &puVar8->loc_1_x;
            do {
              puVar12 = (unit_struct *)0x0;
              if (((*puVar14 != 0) &&
                  (puVar7 = unit_land_array[*puVar14], (*(byte *)&puVar7->flags_2 & 1) == 0)) &&
                 (puVar7->unit_class != '\0')) {
                puVar12 = puVar7;
              }
              if (puVar12 != (unit_struct *)0x0) {
                local_18 = local_18 | 1 << (puVar12->unit_type & 0x1f);
              }
              puVar14 = puVar14 + 1;
              iVar9 = iVar9 + -1;
            } while (iVar9 != 0);
          }
          *psVar17 = *psVar17 + 1;
          if (local_24 != 0) {
            *psVar15 = *psVar15 + 1;
          }
          iVar9 = 1;
          do {
            psVar17 = psVar17 + 1;
            psVar15 = psVar15 + 1;
            if (((local_18 & 1 << ((byte)iVar9 & 0x1f)) != 0) &&
               (*psVar17 = *psVar17 + 1, local_24 != 0)) {
              *psVar15 = *psVar15 + 1;
            }
            iVar9 = iVar9 + 1;
            puVar12 = PTR_008922e8;
          } while (iVar9 < 9);
        }
        break;
      case 5:
        if (puVar8->unit_type == '\t') {
          puVar8->next_unit = head_units;
          head_units = puVar8;
          puVar12 = PTR_008922e8;
        }
        break;
      case 6:
        if (puVar8->unit_type == '\x06') {
          puVar8->next_unit = trigger_units;
          trigger_units = puVar8;
          puVar12 = PTR_008922e8;
        }
        break;
      case 7:
        if (puVar8->unit_type == '\x12') {
          puVar8->next_unit = swamp_effect_units;
          swamp_effect_units = puVar8;
          puVar12 = PTR_008922e8;
        }
        else if (puVar8->unit_type == 'Z') {
          puVar8->next_unit = guard_control_units;
          guard_control_units = puVar8;
          puVar12 = PTR_008922e8;
        }
        break;
      case 8:
        if (puVar8->unit_type == '\x06') {
          puVar8->next_unit = guard_control_units;
          guard_control_units = puVar8;
          puVar12 = PTR_008922e8;
        }
        break;
      case 9:
        sVar5._0_1_ = puVar8->num_points;
        sVar5._1_1_ = puVar8->tex_size_type;
        if (sVar5 == 0) {
          cVar4 = puVar8->tribe_index;
          puVar8->next_unit = game_state.tribes_array[cVar4].shape_units;
          game_state.tribes_array[cVar4].shape_units = puVar8;
          puVar18 = &game_state.tribes_array[cVar4].shapes_num;
          *puVar18 = *puVar18 + 1;
          puVar12 = PTR_008922e8;
        }
        break;
      case 10:
        switch(puVar8->unit_type) {
        case 1:
          puVar8->next_unit = game_state.tribes_array[(char)puVar8->tribe_index].formation_units;
          game_state.tribes_array[(char)puVar8->tribe_index].formation_units = puVar8;
          puVar12 = PTR_008922e8;
          break;
        case 2:
          puVar8->next_unit = game_state.tribes_array[(char)puVar8->tribe_index].beacon_units;
          game_state.tribes_array[(char)puVar8->tribe_index].beacon_units = puVar8;
          puVar12 = PTR_008922e8;
          break;
        case 4:
          if ((puVar8->state_2 == '\b') && (*(short *)&puVar8->field_0x6c != 0)) {
            _DAT_0089bc7a = _DAT_0089bc7a + 1;
          }
          break;
        case 6:
          puVar8->next_unit = game_state.tribes_array[(char)puVar8->tribe_index].formation_units_2;
          game_state.tribes_array[(char)puVar8->tribe_index].formation_units_2 = puVar8;
          puVar12 = PTR_008922e8;
          break;
        case 8:
          puVar8->next_unit = fight_units;
          fight_units = puVar8;
          puVar12 = PTR_008922e8;
          break;
        case 9:
          puVar8->next_unit = pre_fight_units;
          pre_fight_units = puVar8;
          puVar12 = PTR_008922e8;
          break;
        case 10:
          puVar8->next_unit = guard_control_units;
          guard_control_units = puVar8;
          puVar12 = PTR_008922e8;
          break;
        case 0xc:
          if ((byte)puVar8->state_2 < 4) {
            puVar18 = &game_state.tribes_array[(char)puVar8->tribe_index].soul_convert_unit_num;
            *puVar18 = *puVar18 + 1;
            puVar12 = PTR_008922e8;
          }
          else if (puVar8->state_2 == 4) {
            _DAT_0089bc7a = _DAT_0089bc7a + 1;
          }
          break;
        case 0xd:
          puVar8->next_unit = game_state.tribes_array[(char)puVar8->tribe_index].dt_beacon_units;
          game_state.tribes_array[(char)puVar8->tribe_index].dt_beacon_units = puVar8;
          puVar12 = PTR_008922e8;
        }
      }
    }
    PTR_008922e8 = puVar12;
  }
  for (; puVar12 != (unit_struct *)0x0; puVar12 = puVar12->next_unit_1) {
    puVar14 = &(puVar12->object).flags;
    *puVar14 = *puVar14 & 0xfffe;
    if (((puVar12->unit_class == '\n') && (puVar12->unit_type == '\x10')) &&
       (sVar6._0_1_ = puVar12->coord_scale_3, sVar6._1_1_ = puVar12->coord_scale_1, sVar6 != 0)) {
      psVar17 = (short *)((int)game_state.tribes_array[player_tribe_num].field1446_0xb7d + 0x22);
      *psVar17 = *psVar17 + 1;
    }
  }
  if ((game_state.offset_counter_2 & 7) == 0) {
    puVar18 = (undefined4 *)game_state.field15_0x4326c;
    for (iVar9 = 0x10; puVar8 = wild_units, iVar9 != 0; iVar9 = iVar9 + -1) {
      *puVar18 = 0;
      puVar18 = puVar18 + 1;
    }
    for (; puVar8 != (unit_struct *)0x0; puVar8 = puVar8->next_unit) {
      pcVar3 = (char *)((short)((ushort)(puVar8->pos).y >> 10 & 0x38) + 0x8e03e4 +
                       (int)(short)((ushort)(puVar8->pos).x >> 0xd));
      *pcVar3 = *pcVar3 + '\x01';
    }
  }
  iVar9 = 0x89d1c8;
  piVar16 = local_10;
  _DAT_0089c685 = DAT_0089bc76;
  do {
    if (local_20 != 0) {
      iVar13 = DAT_005aa420;
      if (*(char *)(iVar9 + 0xc1f) == '\x02') {
        iVar13 = DAT_005aa41c;
      }
      iVar13 = (int)(*piVar16 * iVar13 + (*piVar16 * iVar13 >> 0x1f & 0xffU)) >> 8;
      add_mana(iVar9,iVar13,0);
      *(int *)(iVar9 + 0x95d) = iVar13;
      *(undefined4 *)(iVar9 + 0x961) = 0;
    }
    piVar2 = (int *)(iVar9 + 0x91d);
    piVar16 = piVar16 + 1;
    iVar9 = iVar9 + 0xc65;
    _DAT_0089c685 = _DAT_0089c685 + *piVar2;
  } while (piVar16 < &stack0x00000000);
  return;
}
