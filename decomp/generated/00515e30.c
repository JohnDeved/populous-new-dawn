/* Ghidra 12.1.3 pseudocode; entry 00515e30; FUN_00515e30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_00515e30(undefined1 param_1,undefined4 *param_2,int param_3,int param_4,code *param_5,
                code *param_6)

{
  int iVar1;
  char cVar2;
  char cVar3;
  undefined2 uVar4;
  unit_struct *puVar5;
  uint uVar6;
  uint uVar7;
  unit_struct *puVar8;
  int iVar9;
  unit_struct *puVar10;
  char local_10;
  char cStack_f;
  undefined2 local_e;
  undefined4 local_c;
  int local_8;
  int local_4;

  local_c = CONCAT31(local_c._1_3_,(char)((ushort)*(undefined2 *)param_2 >> 8)) & 0xfffffffe;
  cVar2 = (char)(param_4 / 2);
  local_c = CONCAT22(local_c._2_2_,
                     CONCAT11((char)((ushort)*(undefined2 *)((int)param_2 + 2) >> 8),
                              (undefined1)local_c)) & 0xfffffeff;
  puVar10 = (unit_struct *)0x0;
  iVar9 = 0;
  local_10 = (char)local_c;
  cStack_f = (char)(local_c >> 8);
  cStack_f = cStack_f + cVar2 * -2;
  for (local_4 = param_4; local_e = CONCAT11(cStack_f,local_10 + cVar2 * -2), local_4 != 0;
      local_4 = local_4 + -1) {
    for (local_8 = param_4; local_8 != 0; local_8 = local_8 + -1) {
      for (puVar8 = unit_land_array
                    [(short)(&game_state.level_data[0].unit_index)
                            [((local_e & 0xfe) * 2 | local_e & 0xfe00) * 2]];
          puVar8 != (unit_struct *)0x0; puVar8 = unit_land_array[puVar8->next_unit_index]) {
        cVar3 = (*param_5)(param_1,puVar8);
        if (cVar3 != '\0') {
          if (puVar10 == (unit_struct *)0x0) {
            puVar8->obj_index_anim_prev = 0;
          }
          else {
            puVar8->obj_index_anim_prev = puVar10->unit_index;
          }
          iVar9 = iVar9 + 1;
          puVar10 = puVar8;
        }
      }
      local_e = CONCAT11(local_e._1_1_,(char)local_e + '\x02');
    }
    cStack_f = local_e._1_1_ + '\x02';
    local_8 = 0;
  }
  if (param_6 != (code *)0x0) {
    local_c = *param_2;
    local_4 = 0;
    for (puVar8 = puVar10; puVar8 != (unit_struct *)0x0;
        puVar8 = unit_land_array[puVar8->obj_index_anim_prev]) {
      uVar4 = calc_distance_toroidal(&local_c,&puVar8->pos);
      *(undefined2 *)((int)&puVar8->loc_3_x + 1) = uVar4;
    }
    if (iVar9 < 0) {
      iVar9 = 0;
    }
    if (param_3 < iVar9) {
      iVar9 = param_3;
    }
    iVar1 = iVar9;
    if (0 < iVar9) {
      do {
        local_8 = iVar1;
        uVar6 = 0xfffffff;
        puVar5 = (unit_struct *)0x0;
        for (puVar8 = puVar10; puVar8 != (unit_struct *)0x0;
            puVar8 = unit_land_array[puVar8->obj_index_anim_prev]) {
          if (((*(byte *)&puVar8->flags_3 & 0x10) == 0) &&
             (uVar7 = (uint)*(ushort *)((int)&puVar8->loc_3_x + 1), uVar7 < uVar6)) {
            puVar5 = puVar8;
            uVar6 = uVar7;
          }
        }
        if (puVar5 != (unit_struct *)0x0) {
          puVar5->flags_3 = puVar5->flags_3 | 0x10;
        }
        local_8 = local_8 + -1;
        iVar1 = local_8;
      } while (local_8 != 0);
    }
    puVar8 = puVar10;
    if (puVar10 != (unit_struct *)0x0) {
      do {
        if ((*(byte *)&puVar8->flags_3 & 0x10) != 0) {
          (*param_6)(param_1,puVar8);
        }
        puVar8 = unit_land_array[puVar8->obj_index_anim_prev];
      } while (puVar8 != (unit_struct *)0x0);
      for (; puVar10 != (unit_struct *)0x0; puVar10 = unit_land_array[puVar10->obj_index_anim_prev])
      {
        *(undefined2 *)((int)&puVar10->loc_3_x + 1) = 0;
        if ((puVar10->flags_3 & 0x10) != 0) {
          puVar10->flags_3 = puVar10->flags_3 & 0xffffffef;
        }
        if ((*(byte *)&puVar10->flags_3 & 0x40) != 0) {
          FUN_004ef180(puVar10);
        }
      }
    }
  }
  return iVar9;
}
