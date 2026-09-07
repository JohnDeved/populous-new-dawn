/* Ghidra 12.1.3 pseudocode; entry 004d56f0; FUN_004d56f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d56f0(ushort param_1)

{
  unit_struct *puVar1;
  bool bVar2;
  uint uVar3;
  byte bVar4;
  int iVar5;
  int iVar6;
  uint uVar7;
  ushort local_a;
  byte local_8 [8];

  bVar2 = false;
  local_8[0] = 0;
  local_8[1] = 0;
  local_8[2] = 0;
  local_8[3] = 0;
  local_8[4] = 0;
  local_8[5] = 0;
  local_a = param_1 & 0xfefe;
  local_8[6] = 0;
  uVar7 = 0;
  uVar3 = (local_a & 0xfe) * 2 | local_a & 0xfe00;
  for (puVar1 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar3 * 2]];
      puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
    if ((((puVar1->unit_class == '\x01') && ((puVar1->obj_index_anim_prev_2 & 1) != 0)) &&
        ((*(ushort *)&unit_type_array_person[(byte)puVar1->unit_type].flags & 0x400) == 0)) &&
       (((*(byte *)&puVar1->loc_2_y & 0xf) != 0 && (puVar1->loc_2_x == local_a)))) {
      uVar7 = uVar7 + 1;
      puVar1->flags_3 = puVar1->flags_3 | 0x10;
      bVar4 = *(byte *)&puVar1->loc_2_y & 0xf;
      local_8[bVar4] = bVar4;
    }
  }
  if (uVar7 != 0) {
    for (puVar1 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar3 * 2]];
        puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
      if (((puVar1->flags_3 & 0x10) != 0) && (*(byte *)&puVar1->loc_2_y >> 4 != uVar7)) {
        bVar2 = true;
        break;
      }
    }
    if (6 < (int)uVar7) {
      uVar7 = 6;
    }
    if (bVar2) {
      iVar5 = 1;
      do {
        iVar6 = iVar5;
        if (local_8[iVar5] == 0) {
          while (iVar6 + 1 < 7) {
            local_8[iVar6 + 1] = local_8[iVar6 + 1] - 1;
            iVar6 = iVar6 + 1;
          }
        }
        iVar5 = iVar5 + 1;
      } while (iVar5 < 7);
    }
    iVar5 = 0;
    for (puVar1 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar3 * 2]];
        puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
      iVar6 = iVar5;
      if (((puVar1->flags_3 & 0x10) != 0) && (puVar1->flags_3 = puVar1->flags_3 & 0xffffffef, bVar2)
         ) {
        *(byte *)&puVar1->obj_index_anim_prev_2 = (byte)puVar1->obj_index_anim_prev_2 | 2;
        iVar6 = iVar5 + 1;
        if (iVar5 < (int)uVar7) {
          bVar4 = *(byte *)&puVar1->loc_2_y;
          bVar4 = (local_8[bVar4 & 0xf] ^ bVar4) & 0xf ^ bVar4;
          *(byte *)&puVar1->loc_2_y = bVar4;
          *(byte *)&puVar1->loc_2_y = bVar4 & 0xf ^ (char)uVar7 << 4;
        }
        else {
          *(byte *)&puVar1->loc_2_y = *(byte *)&puVar1->loc_2_y & 0xf0;
          *(undefined1 *)&puVar1->loc_2_y = 0;
        }
      }
      iVar5 = iVar6;
    }
  }
  return;
}
