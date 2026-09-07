/* Ghidra 12.1.3 pseudocode; entry 00404c80; FUN_00404c80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00404c80(int param_1)

{
  undefined1 *puVar1;
  unit_struct *puVar2;
  char cVar3;
  short sVar4;
  int iVar5;
  int iVar6;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 uVar7;
  shape_entry *psVar8;
  undefined4 local_14;
  undefined4 local_10;
  undefined2 local_c;
  short local_8;
  short local_6;
  undefined2 local_4;

  cVar3 = '\0';
  if ((unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x49 & 4) != 0) {
    if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
      cVar3 = FUN_0041b240(*(undefined1 *)(param_1 + 0x2f),0);
      if (cVar3 == '\0') {
        *(undefined2 *)(param_1 + 0xa4) = 0;
      }
      else {
        iVar5 = FUN_0041b3f0(*(undefined1 *)(param_1 + 0x2f),*(undefined1 *)(param_1 + 0x2b));
        iVar6 = (*(char *)(param_1 + 0xa6) + 1) * 0x200;
        sVar4 = (short)(iVar6 + (iVar6 >> 0x1f & 0xffU) >> 8) + *(short *)(param_1 + 0xa4);
        *(short *)(param_1 + 0xa4) = sVar4;
        if (iVar5 <= sVar4) {
          *(byte *)(param_1 + 0x9d) = *(byte *)(param_1 + 0x9d) | 0x40;
          *(short *)(param_1 + 0xa4) = (short)iVar5;
        }
      }
    }
    if ((*(ushort *)(param_1 + 0x9c) & 0x4000) != 0) {
      *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0xbfff;
      if (cVar3 == '\0') {
        *(undefined2 *)(param_1 + 0xa4) = 0;
      }
      else {
        *(undefined2 *)(param_1 + 0xa4) = 0;
        cVar3 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                [(short)((int)((int)*(short *)(param_1 + 0x26) +
                              ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
        local_8 = *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar3].x2 * -0x100 +
                  (char)shapes_mem[cVar3].field_0x4 * 0x40;
        local_6 = *(short *)(param_1 + 0x7c) + (ushort)(byte)shapes_mem[cVar3].y2 * -0x100 +
                  (char)shapes_mem[cVar3].field_0x5 * 0x40;
        local_14 = CONCAT22(local_6,local_8);
        local_4 = 0;
        ptr_unit_related_20B->field0_0x0 = (int)local_8;
        ptr_unit_related_20B->field1_0x4 = (int)local_6;
        sVar4 = *(short *)(param_1 + 0x26);
        ptr_unit_related_20B->unit_ptr = (unit_struct *)(int)sVar4;
        ptr_unit_related_20B->field3_0xc = 0;
        ptr_unit_related_20B->field4_0x10 = 0;
        ptr_unit_related_20B = ptr_unit_related_20B + 1;
        unit_allocation_flag = 1;
        iVar5 = alloc_unit(1,2,CONCAT31((int3)(char)((ushort)sVar4 >> 8),
                                        *(undefined1 *)(param_1 + 0x2f)),&local_8);
        if (iVar5 != 0) {
          if (*(char *)(param_1 + 0x2f) == player_tribe_num) {
            FUN_0048a050(iVar5,0x28,0);
          }
          puVar2 = wild_units;
          if ((wild_units != (unit_struct *)0x0) && (puVar1 = &wild_units->state, *puVar1 != ' ')) {
            iVar6 = FUN_00499ab0(wild_units);
            if ((iVar6 == 0) && ((*(byte *)((int)&puVar2->flags_2 + 2) & 0x10) == 0)) {
              *(undefined1 *)((int)&puVar2->loc_1_y + 1) = *puVar1;
              empty_unit_function(puVar2);
              *puVar1 = 3;
              init_unit_class(puVar2);
            }
          }
          psVar8 = shapes_mem +
                   (char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                         [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                       ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
          local_8 = *(short *)(param_1 + 0x7a) + (ushort)(byte)psVar8->x2 * -0x100 +
                    (char)psVar8->field6_0x6 * 0x40;
          local_4 = 0;
          local_6 = *(short *)(param_1 + 0x7c) + (ushort)(byte)psVar8->y2 * -0x100 +
                    (char)psVar8->field7_0x7 * 0x40;
          local_14 = CONCAT22(local_6,local_8);
          iVar6 = alloc_unit(7,0x3c,CONCAT31((int3)((uint)psVar8 >> 8),
                                             *(undefined1 *)(param_1 + 0x2f)),&local_8);
          if (iVar6 != 0) {
            *(undefined2 *)(iVar6 + 0x6c) = 0x10;
            unit_set_object(iVar6 + 0x33,0x29,0x5a1);
          }
          if (*(char *)(param_1 + 0x2a) == '\t') {
            FUN_004b9fc0();
            uVar7 = extraout_var;
          }
          else {
            FUN_004044b0(param_1,&local_14);
            uVar7 = extraout_var_00;
          }
          local_10._0_2_ = (undefined2)local_14;
          local_10._2_2_ = local_14._2_2_;
          local_c = 0;
          move_pos_angle_length
                    (&local_10,CONCAT22(uVar7,*(short *)(param_1 + 0x26) + 0x200) & 0xffff07ff,0x200
                    );
          local_14 = CONCAT22(local_10._2_2_,(undefined2)local_10);
          local_10 = local_14;
          iVar6 = FUN_00405050(&local_10);
          if ((*(byte *)(iVar6 + 1) & 2) != 0) {
            FUN_004044b0(unit_land_array[*(ushort *)(iVar6 + 8) & 0x3ff],&local_10);
          }
          *(undefined4 *)(iVar5 + 0x68) = local_10;
          FUN_00405090((undefined4 *)(iVar5 + 0x68));
          *(byte *)(iVar5 + 0x82) = *(byte *)(iVar5 + 0x82) & 0xf0;
          *(undefined1 *)(iVar5 + 0x82) = 0;
          return;
        }
      }
    }
  }
  return;
}
