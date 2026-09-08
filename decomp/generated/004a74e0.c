/* Ghidra 12.1.3 pseudocode; entry 004a74e0; FUN_004a74e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct *
FUN_004a74e0(int param_1,undefined2 *param_2,undefined4 param_3,undefined4 param_4,int param_5)

{
  vector_48b *pvVar1;
  unit_struct *puVar2;
  uint uVar3;
  bool bVar4;
  undefined4 uVar5;
  unit_type_scenery *puVar6;
  int iVar7;
  byte bVar8;
  char cVar9;
  short sVar10;
  unit_struct *puVar11;
  int iVar12;
  undefined2 local_24;
  undefined2 local_22;
  undefined2 local_20;
  undefined2 uStack_1e;
  undefined2 local_1c;
  int local_18;
  undefined1 local_14;
  undefined1 local_13;
  undefined1 local_10;
  undefined1 local_f;
  uint local_c;
  undefined4 local_8;
  undefined4 local_4;

  puVar11 = (unit_struct *)0x0;
  if (param_5 == 0) {
    iVar12 = 1;
    local_18 = 1;
  }
  else if (param_5 == 1) {
    local_18 = 1;
    iVar12 = 0;
  }
  else if (param_5 == 2) {
    local_18 = 0;
    iVar12 = 1;
  }
  else {
    iVar12 = CONCAT22(uStack_1e,local_20);
  }
  bVar8 = get_empty_indexed_xy(2,*(undefined2 *)(param_1 + 0x5d),param_3,param_4);
  local_c = (uint)bVar8;
  if (local_c != 0) {
    local_24 = CONCAT11((char)((ushort)param_2[1] >> 8),(char)((ushort)*param_2 >> 8)) & 0xfefe;
    while (cVar9 = get_indexed_xy(local_c,&local_8,&local_4), cVar9 != '\0') {
      local_22 = CONCAT11((char)local_4 * '\x02' + local_24._1_1_,
                          (char)local_8 * '\x02' + (char)local_24);
      for (puVar2 = unit_land_array
                    [(short)(&game_state.level_data[0].unit_index)
                            [((local_22 & 0xfe) * 2 | local_22 & 0xfe00) * 2]];
          puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
        if (puVar11 != (unit_struct *)0x0) goto LAB_004a770e;
        if (puVar2->unit_class == '\x05') {
          bVar4 = false;
          puVar6 = unit_type_array_scenery + (byte)puVar2->unit_type;
          uVar3._0_1_ = puVar6->flags_1;
          uVar3._1_1_ = puVar6->flags;
          uVar3._2_1_ = puVar6->field14_0x16;
          uVar3._3_1_ = puVar6->field15_0x17;
          iVar7 = local_18;
          if ((((uVar3 & 0x10) != 0) || (iVar7 = iVar12, (uVar3 & 4) != 0)) && (iVar7 != 0)) {
            bVar4 = true;
          }
          if (bVar4) {
            if ((*(short *)(param_1 + 0x9f) == 0) ||
               (bVar4 = true, (*(byte *)(param_1 + 0x13) & 2) == 0)) {
              bVar4 = false;
            }
            puVar11 = puVar2;
            if (bVar4) {
              pvVar1 = &puVar2->pos;
              local_20 = pvVar1->x;
              uStack_1e = (puVar2->pos).y;
              uVar5._0_2_ = pvVar1->x;
              uVar5._2_2_ = pvVar1->y;
              local_1c = 0;
              local_1c = calc_point_height(uVar5,uStack_1e);
              FUN_005178d0(param_1,&local_20);
            }
            else {
              local_10 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
              local_f = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
              local_14 = (undefined1)((ushort)(puVar2->pos).x >> 8);
              local_13 = (undefined1)((ushort)(puVar2->pos).y >> 8);
              FUN_004ea6b0(param_1,&local_10,&local_14);
              sVar10 = FUN_004ea970(param_1,&local_10,&local_14,0);
              if (sVar10 == 0) {
                *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xefffffff;
              }
            }
          }
        }
      }
      if (puVar11 != (unit_struct *)0x0) break;
    }
LAB_004a770e:
    clear_indexed_xy(local_c);
  }
  return puVar11;
}
