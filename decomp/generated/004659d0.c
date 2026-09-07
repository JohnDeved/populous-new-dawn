/* Ghidra 12.1.3 pseudocode; entry 004659d0; FUN_004659d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00465b09) */
/* WARNING: Removing unreachable block (ram,0x00465b13) */

unit_struct * FUN_004659d0(int param_1,int param_2,short *param_3)

{
  undefined2 *puVar1;
  short sVar2;
  ushort uVar3;
  short *psVar4;
  uint uVar5;
  int iVar6;
  uint uVar7;
  unit_struct *puVar8;
  int iVar9;
  byte local_5;

  puVar8 = (unit_struct *)0x0;
  iVar6 = (int)(char)unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x8;
  if ('\0' < *(char *)(param_1 + 0x9e)) {
    if (param_2 == 0) {
      iVar9 = 0;
      if (0 < iVar6) {
        psVar4 = (short *)(param_1 + 0x7a);
        do {
          if (*psVar4 != 0) break;
          psVar4 = psVar4 + 1;
          iVar9 = iVar9 + 1;
        } while (iVar9 < iVar6);
      }
    }
    else {
      iVar9 = 0;
      if (0 < iVar6) {
        psVar4 = (short *)(param_1 + 0x7a);
        do {
          if (*psVar4 == *(short *)(param_2 + 0x24)) break;
          psVar4 = psVar4 + 1;
          iVar9 = iVar9 + 1;
        } while (iVar9 < iVar6);
      }
    }
    if (iVar9 < iVar6) {
      puVar8 = unit_land_array[*(ushort *)(param_1 + 0x7a + iVar9 * 2)];
      puVar8->unit_land_array_index = 0;
      uVar5 = puVar8->flags_4 & 0xfdffffff;
      puVar8->flags_4 = uVar5;
      puVar8->flags_4 = uVar5 | 0x400;
      puVar8->flags_4 = uVar5 | 0x1000400;
      uVar5 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)puVar8->some_index].
                              field_0x4 >> 2;
      if (uVar5 == 0) {
        uVar5 = 1;
      }
      uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar7 >> 0xd | uVar7 * 0x80000;
      sVar2 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)puVar8->some_index].field_0x4
              + (short)(game_state.pseudo_random_val % uVar5);
      puVar8->field36_0x5f = sVar2;
      if ((*(byte *)((int)&puVar8->flags_3 + 2) & 8) != 0) {
        puVar8->field36_0x5f = sVar2 * 2;
      }
      uVar5 = (uint)(ushort)(*param_3 - (puVar8->pos).x);
      uVar7 = (uint)(ushort)(param_3[1] - (puVar8->pos).y);
      if (0x7fff < uVar5) {
        uVar5 = uVar5 - 0x10000;
      }
      if (0x7fff < uVar7) {
        uVar7 = uVar7 - 0x10000;
      }
      uVar3 = calc_angle_quadrant(uVar5,-uVar7);
      unit_clear_vec_2(puVar8);
      FUN_004e94f0(&puVar8->vec2,0xa0,uVar3 & 0x7ff);
      puVar1 = &(puVar8->vec2).y;
      *puVar1 = *puVar1 + 0x3c;
      FUN_004d8250(puVar8,1);
      if (*(short *)&puVar8->field_0x78 == 0) {
        local_5 = *(byte *)(unit_type_to_obj_indexes_map + (byte)puVar8->unit_type + 0x3f);
        unit_set_object_upper(puVar8,local_5);
        (puVar8->object).f2 = 0;
        (puVar8->object).f1 =
             (short)(char)obj_related_array[(byte)(puVar8->object).obj_related_index + 3].f1;
      }
      else {
        local_5 = *(byte *)(unit_type_to_obj_indexes_map + (byte)puVar8->unit_type + 0x24);
        unit_set_object_upper(puVar8,local_5);
      }
      *(byte *)&puVar8->obj_index_anim_prev_2 = (byte)puVar8->obj_index_anim_prev_2 | 0x80;
      *(char *)&puVar8->loc_1_z =
           vstart_related[(short)obj_indexes_table[(uint)local_5 * 2]].frame_counter *
           (obj_related_array[(byte)(puVar8->object).obj_related_index + 3]._f2 + '\x01');
      *(char *)(param_1 + 0x9e) = *(char *)(param_1 + 0x9e) + -1;
      *(undefined2 *)(param_1 + 0x7a + iVar9 * 2) = 0;
      *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 2;
      *(undefined1 *)(param_1 + 0xa0) = 2;
      *(undefined1 *)(param_1 + 0xa1) = puVar8->tribe_index;
      if ((*(char *)(param_1 + 0x9e) != '\0') && (iVar9 == 0)) {
        FUN_004668b0(param_1);
      }
    }
  }
  return puVar8;
}
