/* Ghidra 12.1.3 pseudocode; entry 004866a0; load_level_units_post_processing_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_level_units_post_processing_2(void)

{
  unit_struct *puVar1;
  bool bVar2;
  short *psVar3;
  unit_struct *puVar4;
  int iVar5;
  undefined2 local_2;

  puVar4 = unit_array_ptr_1;
  if (unit_array_ptr_1 < unit_array_ptr_end_1) {
    do {
      if (((puVar4->unit_class == '\x06') && (puVar4->unit_type == '\x06')) &&
         ((char)puVar4->coord_scale_4 == '\x03')) {
        iVar5 = 0;
        bVar2 = false;
        psVar3 = &puVar4->coord_scale_2;
        do {
          if (((*psVar3 != 0) &&
              (puVar1 = unit_land_array[(ushort)*psVar3], puVar1->unit_class == '\x06')) &&
             ((puVar1->unit_type == '\x02' && (*(char *)&puVar1->loc_2_x == '\x01')))) {
            bVar2 = true;
            break;
          }
          psVar3 = psVar3 + 1;
          iVar5 = iVar5 + 1;
        } while (iVar5 < 10);
        if (bVar2) {
          *(undefined1 *)&puVar4->coord_scale_4 = 4;
          bVar2 = false;
          local_2 = CONCAT11((char)((ushort)(puVar4->pos).y >> 8),
                             (char)((ushort)(puVar4->pos).x >> 8));
          for (puVar1 = unit_land_array
                        [(short)(&game_state.level_data[0].unit_index)
                                [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2]];
              puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
            if ((puVar1->unit_class == '\x05') && (puVar1->unit_type == '\t')) {
              bVar2 = true;
              break;
            }
          }
          if (bVar2) {
            ptr_unit_related_20B->field0_0x0 =
                 (int)(short)((int)((int)(short)puVar1->maybe_shape_angle +
                                   ((int)(short)puVar1->maybe_shape_angle >> 0x1f & 0x1ffU)) >> 9);
            ptr_unit_related_20B->field1_0x4 = 0;
            ptr_unit_related_20B->unit_ptr = (unit_struct *)0x2;
            ptr_unit_related_20B->field3_0xc = 0xffffffff;
            ptr_unit_related_20B->field4_0x10 = 0;
            ptr_unit_related_20B = ptr_unit_related_20B + 1;
            unit_allocation_flag = 1;
            alloc_unit(2,0x12,0xff,&puVar1->pos);
            puVar1->state = 0xc;
            FUN_004ef180(puVar1);
          }
        }
      }
      puVar4 = puVar4 + 1;
    } while (puVar4 < unit_array_ptr_end_1);
  }
  return;
}
