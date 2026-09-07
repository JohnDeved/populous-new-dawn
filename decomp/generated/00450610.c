/* Ghidra 12.1.3 pseudocode; entry 00450610; FUN_00450610.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00450610(int param_1,ushort param_2)

{
  uint *puVar1;
  uint uVar2;
  char cVar3;
  char cVar4;
  land_pos *plVar5;
  undefined4 uVar6;
  uint uVar7;
  unit_struct *puVar8;
  unit_struct *puVar9;
  int iVar10;
  char local_c;
  char cStack_b;
  undefined2 auStack_8 [2];
  undefined4 local_4;

  switch(param_1) {
  case 0:
    plVar5 = game_state.level_data;
    iVar10 = 0x4000;
    do {
      plVar5->flags = plVar5->flags & 0xfffffff7;
      plVar5 = plVar5 + 1;
      iVar10 = iVar10 + -1;
    } while (iVar10 != 0);
    if (landscape_flags_1 == '\x03') {
      set_landscape_c_4_and_texture(0,0x40);
      return;
    }
    break;
  case 1:
    plVar5 = game_state.level_data;
    iVar10 = 0x4000;
    do {
      puVar8 = (unit_struct *)0x0;
      if ((plVar5->flags & 8) == 0) {
        puVar9 = unit_land_array[(short)plVar5->unit_index];
        while ((puVar8 = (unit_struct *)0x0, puVar9 != (unit_struct *)0x0 &&
               ((puVar9->unit_class != '\x05' ||
                (puVar8 = puVar9,
                (unit_type_array_scenery[(byte)puVar9->unit_type].flags_1 & 4) == 0))))) {
          puVar9 = unit_land_array[puVar9->next_unit_index];
        }
      }
      plVar5->flags = plVar5->flags | 8;
      if (puVar8 != (unit_struct *)0x0) {
        FUN_00494f50(puVar8);
      }
      plVar5 = plVar5 + 1;
      iVar10 = iVar10 + -1;
    } while (iVar10 != 0);
    if (landscape_flags_1 == '\x03') {
      set_landscape_c_4_and_texture(0,0x40);
      return;
    }
    break;
  case 2:
  case 5:
    if (param_1 != 2) {
      uVar6 = 0xe;
    }
    else {
      uVar6 = 5;
    }
    cVar3 = get_empty_indexed_xy(2,0,0,uVar6);
    if (cVar3 != '\0') {
      cVar4 = get_indexed_xy(cVar3,&local_4,auStack_8);
      while (cVar4 != '\0') {
        local_c = (char)param_2;
        local_c = (char)local_4 * '\x02' + local_c;
        cStack_b = (char)(param_2 >> 8);
        cStack_b = (char)auStack_8[0] * '\x02' + cStack_b;
        uVar7 = (CONCAT11(cStack_b,local_c) & 0xfe) * 2 | CONCAT11(cStack_b,local_c) & 0xfe00;
        puVar1 = &game_state.level_data[0].flags + uVar7;
        uVar2 = *puVar1;
        if ((uVar2 & 8) == 0) {
          puVar8 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar7 * 2]];
          while ((puVar9 = (unit_struct *)0x0, puVar8 != (unit_struct *)0x0 &&
                 ((puVar8->unit_class != '\x05' ||
                  (puVar9 = puVar8,
                  (unit_type_array_scenery[(byte)puVar8->unit_type].flags_1 & 4) == 0))))) {
            puVar8 = unit_land_array[puVar8->next_unit_index];
          }
          *puVar1 = uVar2 | 8;
          if (puVar9 != (unit_struct *)0x0) {
            FUN_00494f50(puVar9);
          }
          if ((param_1 == 2) && (landscape_flags_1 == '\x03')) {
            set_landscape_c_4_and_texture(CONCAT22(auStack_8[0],CONCAT11(cStack_b,local_c)),1);
          }
        }
        cVar4 = get_indexed_xy(cVar3,&local_4,auStack_8);
      }
      clear_indexed_xy(cVar3);
      return;
    }
    break;
  case 3:
  case 4:
    uVar7 = (param_2 & 0xfe) * 2 | param_2 & 0xfe00;
    uVar2 = (&game_state.level_data[0].flags)[uVar7];
    puVar8 = (unit_struct *)0x0;
    if ((uVar2 & 8) == 0) {
      puVar9 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar7 * 2]];
      while ((puVar8 = (unit_struct *)0x0, puVar9 != (unit_struct *)0x0 &&
             ((puVar9->unit_class != '\x05' ||
              (puVar8 = puVar9, (unit_type_array_scenery[(byte)puVar9->unit_type].flags_1 & 4) == 0)
              )))) {
        puVar9 = unit_land_array[puVar9->next_unit_index];
      }
    }
    (&game_state.level_data[0].flags)[uVar7] = uVar2 | 8;
    if (puVar8 != (unit_struct *)0x0) {
      FUN_00494f50(puVar8);
    }
    if ((param_1 != 4) && (landscape_flags_1 == '\x03')) {
      set_landscape_c_4_and_texture(param_2,1);
    }
  }
  return;
}
