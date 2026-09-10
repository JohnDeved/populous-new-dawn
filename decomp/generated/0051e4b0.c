/* Ghidra 12.1.3 pseudocode; entry 0051e4b0; FUN_0051e4b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_0051e4b0(unit_struct *param_1,undefined4 *param_2,char param_3)

{
  unit_struct *puVar1;
  bool bVar2;
  char cVar3;
  uint uVar4;
  int iVar5;
  undefined4 local_8;
  undefined2 local_4;

  bVar2 = true;
  local_8._0_2_ =
       CONCAT11((char)((ushort)*(undefined2 *)((int)param_2 + 2) >> 8),
                (char)((ushort)*(undefined2 *)param_2 >> 8));
  uVar4 = ((ushort)local_8 & 0xfe) * 2 | (ushort)local_8 & 0xfe00;
  if ((((&game_state.level_data[0].flags)[uVar4] & 0x206) == 0) &&
     ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar4 * 4] & 0xf)) & 0x3c
      ) == 0)) {
    if (param_3 != '\0') {
      for (puVar1 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar4 * 2]];
          puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
        if (!bVar2) {
          return bVar2;
        }
        if (((puVar1->unit_class == '\n') && (puVar1->unit_type == '\b')) && (puVar1 != param_1)) {
          bVar2 = false;
        }
      }
    }
    if (bVar2 != false) {
      iVar5 = 0;
      uVar4 = (uint)(short)param_1->maybe_shape_angle;
      while (bVar2 != false) {
        local_4 = *(undefined2 *)(param_2 + 1);
        local_8 = *param_2;
        move_pos_angle_length(&local_8,uVar4,0xb4);
        cVar3 = FUN_005178d0(param_1,&local_8);
        if (cVar3 != '\0') {
          bVar2 = false;
        }
        iVar5 = iVar5 + 1;
        uVar4 = uVar4 + 0x200 & 0x7ff;
        if (3 < iVar5) {
          return bVar2;
        }
      }
    }
  }
  return false;
}
