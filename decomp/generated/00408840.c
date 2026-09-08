/* Ghidra 12.1.3 pseudocode; entry 00408840; FUN_00408840.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00408840(int param_1)

{
  char cVar1;
  byte bVar2;
  unit_struct *puVar3;
  uint uVar4;
  undefined4 uVar5;
  int iVar6;
  uint uVar7;
  int iVar8;
  byte *pbVar9;
  undefined2 local_16;
  short local_10;
  short sStack_e;
  undefined2 local_c;
  short local_8;
  short local_6;

  *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0xfffd;
  *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x20;
  iVar8 = 0;
  *(undefined2 *)(param_1 + 0x6c) = 0;
  *(undefined1 *)(param_1 + 0xa7) = 0x7f;
  *(undefined2 *)(param_1 + 0x6e) = 0;
  cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
          [(short)((int)((int)*(short *)(param_1 + 0x26) +
                        ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  local_8 = *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar1].x2 * -0x100;
  pbVar9 = &shapes_mem[cVar1].field_0x1a;
  local_6 = *(short *)(param_1 + 0x7c) + (ushort)(byte)shapes_mem[cVar1].y2 * -0x100;
  do {
    bVar2 = pbVar9[1];
    if (((*pbVar9 != 0) || (bVar2 != 0)) || (pbVar9[2] != 0)) {
      local_10 = (ushort)*pbVar9 * 0x20 + local_8;
      uVar5 = CONCAT22(sStack_e,local_10);
      sStack_e = (ushort)pbVar9[2] * 0x20 + local_6;
      local_c = calc_point_height(uVar5,CONCAT22(local_c,sStack_e));
      ptr_unit_related_20B->field0_0x0 = (uint)(iVar8 == 0);
      ptr_unit_related_20B->field1_0x4 = 0;
      ptr_unit_related_20B->unit_ptr = (unit_struct *)(bVar2 + 1);
      ptr_unit_related_20B->field3_0xc = 1;
      ptr_unit_related_20B->field4_0x10 = 0;
      ptr_unit_related_20B = ptr_unit_related_20B + 1;
      unit_allocation_flag = 1;
      iVar6 = alloc_unit(5,10,*(undefined1 *)(param_1 + 0x2f),&local_10);
      if (iVar6 != 0) {
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x10;
        bVar2 = *(byte *)(iVar6 + 0x90);
        *(byte *)(iVar6 + 0x90) = bVar2 | 1;
        *(byte *)(iVar6 + 0x90) = bVar2 | 5;
        FUN_004a8c60(iVar6,0x87);
        local_16 = CONCAT11((char)((ushort)sStack_e >> 8),(char)((ushort)local_10 >> 8));
        for (puVar3 = unit_land_array
                      [(short)(&game_state.level_data[0].unit_index)
                              [((local_16 & 0xfe) * 2 | local_16 & 0xfe00) * 2]];
            puVar3 != (unit_struct *)0x0; puVar3 = unit_land_array[puVar3->next_unit_index]) {
          if (((puVar3->unit_class == '\x01') && (puVar3->tribe_index == *(char *)(param_1 + 0x2f)))
             && ((unit_type_array_person[(byte)puVar3->unit_type].field_0x31 & 1) == 0)) {
            if ((*(byte *)((int)&puVar3->flags_2 + 2) & 0x10) == 0) {
              *(undefined1 *)((int)&puVar3->loc_1_y + 1) = puVar3->state;
              empty_unit_function(puVar3);
              puVar3->state = 0x1a;
              init_unit_class(puVar3);
            }
            uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            uVar4 = uVar7 >> 0xd;
            game_state.pseudo_random_val = uVar4 | uVar7 * 0x80000;
            puVar3->field_0xa4 = ((byte)uVar4 & 7) + 8;
          }
        }
      }
    }
    pbVar9 = pbVar9 + 3;
    iVar8 = iVar8 + 1;
  } while (iVar8 < 6);
  return;
}
