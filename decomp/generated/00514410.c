/* Ghidra 12.1.3 pseudocode; entry 00514410; FUN_00514410.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x005148ef) */
/* WARNING: Removing unreachable block (ram,0x005148e5) */
/* WARNING: Removing unreachable block (ram,0x00514897) */
/* WARNING: Removing unreachable block (ram,0x005148a1) */

void FUN_00514410(int param_1)

{
  undefined2 *puVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;
  unit_struct *puVar4;
  bool bVar5;
  bool bVar6;
  char cVar7;
  ushort uVar8;
  uint uVar9;
  uint uVar10;
  int iVar11;
  unit_struct *puVar12;
  unit_struct *puVar13;
  int iVar14;
  uint local_8;

  bVar5 = false;
  if ((*(byte *)(param_1 + 0x11) & 8) == 0) {
    puVar2 = unit_land_array[*(ushort *)(param_1 + 0x88)];
    puVar3 = unit_land_array[*(ushort *)(param_1 + 0x8a)];
    local_8._0_2_ =
         CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                  (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
    uVar8 = (ushort)local_8;
    local_8 = (uint)(ushort)local_8;
    uVar9 = (local_8 & 0xfe) * 2 | local_8 & 0xfe00;
    uVar10 = (uint)(short)(&game_state.level_data[0].unit_index)[uVar9 * 2];
    puVar13 = unit_land_array[uVar10];
    while (puVar13 != (unit_struct *)0x0) {
      bVar6 = true;
      if ((puVar13->unit_class == '\x01') && (cVar7 = FUN_00416d70(puVar13,param_1), cVar7 != '\0'))
      {
        bVar6 = false;
      }
      if (bVar6) {
        cVar7 = puVar13->unit_class;
        if (cVar7 == '\x01') {
          if ((*(byte *)(param_1 + 0x16) & 8) == 0) {
            iVar14 = 100;
            iVar11 = 0;
          }
          else {
            iVar11 = DAT_005aa5ac * 4;
            iVar14 = DAT_005aa5ac * 100;
          }
          FUN_004da080(puVar13,CONCAT31((int3)((uint)iVar11 >> 8),*(undefined1 *)(param_1 + 0x2f)),
                       iVar14,0);
          if (game_state.tribes_array[(char)puVar13->tribe_index].field_0xc1f == '\x01') {
            FUN_004f1d00((char)puVar13->tribe_index * 0xc65 + 0x89d1c8,puVar13,param_1);
          }
          puVar13->flags_2 = puVar13->flags_2 | 0x10;
          if (*(short *)&puVar13->field_0x6e < 1) {
            puVar12 = (unit_struct *)0x0;
            if (((*(ushort *)(param_1 + 0x88) != 0) &&
                (puVar4 = unit_land_array[*(ushort *)(param_1 + 0x88)],
                (*(byte *)&puVar4->flags_2 & 1) == 0)) && (puVar4->unit_class != '\0')) {
              puVar12 = puVar4;
            }
            if (puVar12 != (unit_struct *)0x0) {
              FUN_004f3190(puVar12,puVar13);
            }
          }
        }
        else if (cVar7 == '\x04') {
          FUN_00466f00(puVar13,*(undefined1 *)(param_1 + 0x2f),100);
        }
        else if (((cVar7 == '\x05') &&
                 ((unit_type_array_scenery[(byte)puVar13->unit_type].field14_0x16 & 4) != 0)) &&
                (puVar13->field40_0x65 == '\0')) {
          puVar13->field40_0x65 = 1;
          *(ushort *)&puVar13->field_0x61 = uVar8;
        }
        if (puVar13 == puVar3) {
          bVar5 = true;
        }
      }
      uVar10 = (uint)puVar13->next_unit_index;
      puVar13 = unit_land_array[uVar10];
    }
    if (puVar3 != (unit_struct *)0x0) {
      if (puVar2 != (unit_struct *)0x0) {
        FUN_00431ea0(puVar2,puVar2->tribe_index,CONCAT31((int3)(uVar10 >> 8),puVar3->tribe_index),3)
        ;
      }
      if (puVar3->unit_class == '\x01') {
        if (bVar5) {
          iVar14 = DAT_005aa470;
          if ((puVar2 != (unit_struct *)0x0) &&
             (iVar11 = get_adjacent_unit(puVar2,4), iVar14 = DAT_005aa470, iVar11 != 0)) {
            iVar14 = DAT_005aa478;
          }
          if ((puVar3->unit_type == 7) && (puVar3->unit_land_array_index != 0)) {
            iVar14 = *(short *)&puVar3->field_0x6c * DAT_005aa5e8;
          }
          else {
            iVar14 = (short)unit_type_array_person[(byte)puVar3->unit_type].sw_blast_damage * iVar14
            ;
          }
          iVar14 = (int)(iVar14 + (iVar14 >> 0x1f & 0xffU)) >> 8;
          if ((*(byte *)(param_1 + 0x16) & 8) != 0) {
            iVar14 = iVar14 * DAT_005aa5ac;
          }
          FUN_004da080(puVar3,CONCAT31((int3)((uint)iVar14 >> 8),*(undefined1 *)(param_1 + 0x2f)),
                       iVar14,0);
          if (*(short *)&puVar3->field_0x6e < 1) {
            FUN_00466c80(puVar3,1);
          }
          if (game_state.tribes_array[(char)puVar3->tribe_index].field_0xc1f == '\x01') {
            FUN_004f1d00((char)puVar3->tribe_index * 0xc65 + 0x89d1c8,puVar3,param_1);
          }
          if (puVar2 != (unit_struct *)0x0) {
            if (puVar3->unit_type == '\x06') {
              FUN_00520610(puVar3,puVar2);
            }
            else if (puVar3->unit_type == '\b') {
              FUN_004de570(puVar3,puVar2);
            }
          }
          if (*(short *)&puVar3->field_0x6e < 1) {
            puVar13 = (unit_struct *)0x0;
            if (((*(ushort *)(param_1 + 0x88) != 0) &&
                (puVar12 = unit_land_array[*(ushort *)(param_1 + 0x88)],
                (*(byte *)&puVar12->flags_2 & 1) == 0)) && (puVar12->unit_class != '\0')) {
              puVar13 = puVar12;
            }
            if (puVar13 != (unit_struct *)0x0) {
              FUN_004f3190(puVar13,puVar3);
            }
          }
        }
      }
      else if ((puVar3->unit_class == '\x02') &&
              (((&game_state.level_data[0].unit_index_2)[uVar9 * 2] & 0x3ff) == puVar3->unit_index))
      {
        if (((puVar2 == (unit_struct *)0x0) ||
            (iVar11 = get_adjacent_unit(puVar2,4), iVar14 = DAT_005aa478, iVar11 == 0)) &&
           (iVar14 = DAT_005aa470,
           game_state.tribes_array[(char)puVar3->tribe_index].field_0xc1f == '\x01')) {
          FUN_004f1d00((char)puVar3->tribe_index * 0xc65 + 0x89d1c8,puVar3,param_1);
        }
        if ((*(byte *)(param_1 + 0x16) & 8) != 0) {
          iVar14 = iVar14 * DAT_005aa5ac;
        }
        FUN_00409200(puVar3,iVar14,*(undefined1 *)(param_1 + 0x2f));
        if (puVar3->field40_0x65 == '\0') {
          puVar3->field40_0x65 = 1;
          *(ushort *)&puVar3->field_0x61 = uVar8;
        }
      }
    }
    for (puVar3 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar9 * 2]];
        puVar3 != (unit_struct *)0x0; puVar3 = unit_land_array[puVar3->next_unit_index]) {
      if (((puVar3->flags_2 & 0x10) != 0) &&
         (puVar3->flags_2 = puVar3->flags_2 & 0xffffffef,
         (*(byte *)((int)&puVar3->flags_4 + 1) & 1) != 0)) {
        bVar5 = true;
        if (((unit_type_array_person[(byte)puVar3->unit_type].field_0x31 & 2) != 0) &&
           (0 < *(short *)&puVar3->field_0x6e)) {
          bVar5 = false;
        }
        if (puVar3->unit_land_array_index != 0) {
          puVar13 = unit_land_array[(ushort)puVar3->unit_land_array_index];
          puVar12 = (unit_struct *)0x0;
          if (((*(byte *)&puVar13->flags_2 & 1) == 0) && (puVar13->unit_class != '\0')) {
            puVar12 = puVar13;
          }
          if (puVar12 != (unit_struct *)0x0) {
            *(undefined1 *)((int)&puVar12->unit_land_array_index + 1) = 1;
          }
          if (0 < *(short *)&puVar3->field_0x6e) {
            bVar5 = false;
          }
        }
        if (bVar5) {
          uVar10 = puVar3->flags_2;
          puVar3->flags_2 = uVar10 | 0x2000;
          puVar3->flags_2 = uVar10 | 0x82000;
          puVar3->flags_3 = puVar3->flags_3 | 8;
          if (puVar2 == (unit_struct *)0x0) {
            uVar10 = (uint)(ushort)((puVar3->pos).x - *(short *)(param_1 + 0x3d));
            uVar9 = (uint)(ushort)((puVar3->pos).y - *(short *)(param_1 + 0x3f));
            if (0x7fff < uVar10) {
              uVar10 = uVar10 - 0x10000;
            }
            if (0x7fff < uVar9) {
              uVar9 = uVar9 - 0x10000;
            }
          }
          else {
            uVar10 = (uint)(ushort)((puVar3->pos).x - (puVar2->pos).x);
            uVar9 = (uint)(ushort)((puVar3->pos).y - (puVar2->pos).y);
            if (0x7fff < uVar10) {
              uVar10 = uVar10 - 0x10000;
            }
            if (0x7fff < uVar9) {
              uVar9 = uVar9 - 0x10000;
            }
          }
          uVar8 = calc_angle_quadrant(uVar10,-uVar9);
          FUN_004e93f0(&puVar3->vec2,&puVar3->pos,0x40,uVar8 & 0x7ff);
          puVar1 = &(puVar3->vec2).y;
          *puVar1 = *puVar1 + 0x6e;
        }
        else {
          (puVar3->vec2).y = 0x24;
        }
        FUN_004d3ea0(puVar3);
      }
    }
  }
  return;
}
