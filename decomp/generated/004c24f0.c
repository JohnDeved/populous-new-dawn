/* Ghidra 12.1.3 pseudocode; entry 004c24f0; FUN_004c24f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004c24f0(undefined4 param_1,char param_2,int param_3,undefined2 *param_4,int param_5)

{
  char cVar1;
  unit_struct *puVar2;
  uint uVar3;
  bool bVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  undefined2 local_12;
  undefined2 local_10;
  undefined2 local_e;
  undefined2 local_c;
  undefined2 local_a;
  undefined2 local_8;
  undefined2 local_6;

  iVar5 = (int)(char)param_1;
  iVar8 = -1;
  if (param_3 < 1) {
    return -1;
  }
  if ((param_2 != '\0') && (iVar6 = FUN_0044b060(), iVar6 != 0)) {
    return -1;
  }
  if (((game_state.level_flags & 0x20) != 0) && ((&DAT_005a80fe)[param_3 * 0x3e] != '\0')) {
    iVar6 = 1;
    iVar8 = FUN_004c2e30(0,param_1,param_3);
    local_10 = *(undefined2 *)&game_state.tribes_array[iVar5].field_0x911;
    local_e = *(undefined2 *)&game_state.tribes_array[iVar5].field_0x913;
    if (param_3 == 0xc) {
      FUN_004bb160(player_tribe_num * 0xc65 + 0x89d1c8,&local_8);
      local_c = local_8;
      local_a = local_6;
      iVar5 = calc_distance_toroidal(&local_10,&local_c);
      if ((iVar8 < iVar5) || (iVar5 = calc_distance_toroidal(&local_10,param_4), iVar8 < iVar5)) {
        return -2;
      }
    }
    else {
      iVar5 = calc_distance_toroidal(&local_10,param_4);
      if (iVar8 < iVar5) {
        iVar6 = -2;
      }
    }
    return iVar6;
  }
  puVar2 = game_state.tribes_array[iVar5].shaman;
  if ((puVar2 == (unit_struct *)0x0) || (uVar3 = puVar2->flags_2, (uVar3 & 1) != 0)) {
    if ((game_state.tribes_array[iVar5].field_0x93f & 8) == 0) goto LAB_004c2702;
  }
  else {
    cVar1 = puVar2->tribe_index;
    if ((game_state.tribes_array[cVar1].field_0x93f & 8) != 0) goto LAB_004c26b8;
    if ((puVar2->state == '\x16') || (puVar2->state == '\x03')) {
      bVar4 = false;
    }
    else if (game_state.tribes_array[cVar1].field_0xc5e == '\0') {
      if (game_state.tribes_array[cVar1].field_0xc1f == '\x01') {
        if (((uVar3 & 3) == 0) && ((*(byte *)((int)&puVar2->flags_4 + 1) & 4) == 0)) {
          if (game_state.tribes_array[cVar1].field_0x5bd == '\0') goto LAB_004c26b8;
          bVar4 = false;
        }
        else {
          bVar4 = false;
        }
      }
      else if (((uVar3 & 3) == 0) && ((*(byte *)((int)&puVar2->flags_4 + 1) & 4) == 0)) {
LAB_004c26b8:
        bVar4 = true;
      }
      else {
        bVar4 = false;
      }
    }
    else {
      bVar4 = false;
    }
    if (!bVar4) goto LAB_004c2702;
    iVar8 = -2;
    iVar6 = FUN_004c2e30(puVar2,param_1,param_3);
    iVar7 = calc_distance_toroidal(&(game_state.tribes_array[iVar5].shaman)->pos,param_4);
    if (iVar6 < iVar7) goto LAB_004c2702;
  }
  iVar8 = 1;
LAB_004c2702:
  if ((0 < iVar8) && (param_3 == 0xc)) {
    iVar8 = -3;
    local_12 = CONCAT11((char)((ushort)param_4[1] >> 8),(char)((ushort)*param_4 >> 8));
    iVar6 = ((local_12 & 0xfe) * 2 | local_12 & 0xfe00) * 4;
    if ((game_state.tribes_array[iVar5].field_0x93f & 8) == 0) {
      if (param_5 != 0) {
        if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar6] & 0xf)) & 2)
            != 0) {
          FUN_00499d90(0x8000,0x255);
        }
        puVar2 = game_state.tribes_array[iVar5].shaman;
        if ((puVar2->unit_land_array_index == 0) ||
           (bVar4 = true, (*(byte *)((int)&puVar2->flags_4 + 3) & 2) == 0)) {
          bVar4 = false;
        }
        if (bVar4) {
          FUN_00499d90(0x8000000,0x261);
        }
      }
      if (((game_state.tribes_array[iVar5].shaman)->unit_land_array_index == 0) &&
         ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar6] & 0xf)) & 2)
          == 0)) {
        return 1;
      }
    }
    else if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar6] & 0xf)) & 2
             ) == 0) {
      iVar8 = 1;
    }
  }
  return iVar8;
}
