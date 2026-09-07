/* Ghidra 12.1.3 pseudocode; entry 004d4040; unit_set_object_upper.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall unit_set_object_upper(undefined4 param_1,int param_2,short param_3)

{
  char cVar1;
  ushort uVar2;
  ushort uVar3;
  unit_struct *puVar4;
  bool bVar5;
  int iVar6;
  undefined2 extraout_var;
  uint uVar7;
  unit_struct *puVar8;

  puVar8 = (unit_struct *)0x0;
  uVar2 = *(ushort *)(param_2 + 0x35);
  bVar5 = false;
  uVar3 = *(ushort *)(param_2 + 0x76);
  uVar7 = CONCAT22((short)((uint)param_1 >> 0x10),uVar3) & 0xffffff7f;
  *(short *)(param_2 + 0x76) = (short)uVar7;
  if (((((*(byte *)(param_2 + 0x12) & 0x80) != 0) && (*(short *)(param_2 + 0x9f) != 0)) &&
      (cVar1 = *(char *)(param_2 + 0x2c), cVar1 != '\v')) &&
     (((cVar1 != '\x0e' && (cVar1 != ')')) && ((uVar3 & 0x200) == 0)))) {
    bVar5 = true;
    param_3 = unit_type_to_obj_indexes_map[*(byte *)(param_2 + 0x2b) + 0xd8];
    iVar6 = (int)param_3;
    unit_set_object(param_2 + 0x33,
                    CONCAT22((short)((uint)(iVar6 * 4) >> 0x10),obj_indexes_table[iVar6 * 2 + 1]),
                    CONCAT22((short)(uVar7 >> 0x10),obj_indexes_table[iVar6 * 2]));
    *(undefined2 *)(param_2 + 0x37) = 0;
    uVar7 = CONCAT31((int3)(CONCAT22(extraout_var,*(undefined2 *)(param_2 + 0x35)) >> 8),
                     (char)*(undefined2 *)(param_2 + 0x35)) | 2;
    *(short *)(param_2 + 0x35) = (short)uVar7;
    *(undefined1 *)(param_2 + 0x39) = 0;
    if (((unit_land_array[*(ushort *)(param_2 + 0x9f)]->loc_1_x != 0) &&
        (puVar4 = unit_land_array[(ushort)unit_land_array[*(ushort *)(param_2 + 0x9f)]->loc_1_x],
        (*(byte *)&puVar4->flags_2 & 1) == 0)) && (puVar4->unit_class != '\0')) {
      puVar8 = puVar4;
    }
    if ((puVar8 != (unit_struct *)0x0) && (puVar8->field36_0x5f != 0)) {
      uVar7 = CONCAT22(extraout_var,(short)uVar7) & 0xfffffffd;
      *(short *)(param_2 + 0x35) = (short)uVar7;
    }
  }
  if (!bVar5) {
    iVar6 = (int)param_3;
    unit_set_object(param_2 + 0x33,
                    CONCAT22((short)((uint)(iVar6 * 4) >> 0x10),obj_indexes_table[iVar6 * 2 + 1]),
                    CONCAT22((short)(uVar7 >> 0x10),obj_indexes_table[iVar6 * 2]));
  }
  if (((*(char *)(param_2 + 0x2c) == '!') &&
      (game_state.tribes_array[*(char *)(param_2 + 0x2f)].field_0xc1f != '\x01')) &&
     ((*(byte *)(param_2 + 0xe) & 8) == 0)) {
    iVar6 = (int)unit_type_to_obj_indexes_map[*(byte *)(param_2 + 0x2b) + 0x3f];
    unit_set_object(param_2 + 0x33,
                    CONCAT22((short)((uint)(iVar6 * 4) >> 0x10),obj_indexes_table[iVar6 * 2 + 1]),
                    CONCAT22(*(char *)(param_2 + 0x2f) >> 7,obj_indexes_table[iVar6 * 2]));
    *(byte *)(param_2 + 0x35) = *(byte *)(param_2 + 0x35) | 2;
    *(undefined2 *)(param_2 + 0x37) = 0;
    *(undefined1 *)(param_2 + 0x39) = 1;
  }
  if ((unit_type_array_person[*(byte *)(param_2 + 0x2b)].flags & 1) != 0) {
    *(byte *)(param_2 + 0x35) = *(byte *)(param_2 + 0x35) | 0x80;
  }
  if ((byte)vstart_related[*(short *)(param_2 + 0x33)].frame_counter <= *(byte *)(param_2 + 0x39)) {
    *(undefined1 *)(param_2 + 0x39) = 0;
  }
  if (((*(uint *)(param_2 + 0x10) & 0x800) != 0) && (*(char *)(param_2 + 0x2f) == player_tribe_num))
  {
    *(byte *)(param_2 + 0x36) = *(byte *)(param_2 + 0x36) | 0x40;
  }
  if ((*(uint *)(param_2 + 0x10) & 0x1000) != 0) {
    if ((game_state.tribes_array[player_tribe_num].field_0x93d & 8) == 0) {
      if (*(char *)(param_2 + 0x2f) == player_tribe_num) {
        *(byte *)(param_2 + 0x36) = *(byte *)(param_2 + 0x36) | 0x40;
      }
      else {
        *(byte *)(param_2 + 0x35) = *(byte *)(param_2 + 0x35) | 0x10;
      }
    }
    else {
      *(byte *)(param_2 + 0x36) = *(byte *)(param_2 + 0x36) | 0x40;
    }
    if ((*(byte *)(param_2 + 0x2b) == 7) &&
       ((game_state.tribes_array[*(char *)(param_2 + 0x2f)].field_0x93f & 8) != 0)) {
      *(byte *)(param_2 + 0x35) = *(byte *)(param_2 + 0x35) | 0x10;
    }
  }
  if (((((game_state.level_flags & 2) != 0) && ((uVar2 & 0x10) != 0)) &&
      (game_state.some_unit != (unit_struct *)0x0)) && ((byte)(game_state.some_unit)->state_2 < 2))
  {
    *(byte *)(param_2 + 0x35) = *(byte *)(param_2 + 0x35) | 0x10;
  }
  return;
}
