/* Ghidra 12.1.3 pseudocode; entry 0045ddf0; d3d_exec_create.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void d3d_exec_create(void)

{
  int iVar1;
  char cVar2;
  vfra_struct *pvVar3;
  short sVar4;
  undefined4 uVar5;
  uint uVar6;
  undefined4 *puVar7;
  undefined3 uVar9;
  int iVar8;
  int iVar10;
  int iVar11;
  undefined4 *puVar12;
  undefined4 local_88;
  ushort local_84;
  undefined2 local_82;
  undefined2 local_80;
  short local_7e;
  short local_7c;
  undefined2 local_7a;
  undefined1 local_77;
  undefined1 local_76;
  undefined4 local_74 [6];
  undefined4 local_5c;
  undefined4 local_58;
  int local_3d;
  int local_39;
  int local_2d;
  int local_29;

  iVar8 = (int)(DAT_00749e3c / 2) + (int)DAT_00749e38;
  iVar1 = (int)(DAT_00749e3e / 2) + (int)DAT_00749e3a;
  iVar10 = DAT_00749e08 * 0xd;
  cVar2 = s_D3DERR_EXECUTE_CREATE_FAILED_0059a194[DAT_00749e08 * 0xd + 1];
  switch(cVar2) {
  case '\0':
    iVar11 = (int)(short)obj_indexes_table
                         [*(int *)(s_D3DERR_EXECUTE_CREATE_FAILED_0059a194 + iVar10 + 2) * 2 + 1];
    if ((DAT_00749ed4 != game_state.offset_counter) &&
       (DAT_0059d868 = DAT_0059d868 + 1,
       (int)(uint)(byte)vstart_related
                        [(short)obj_indexes_table
                                [*(int *)(s_D3DERR_EXECUTE_CREATE_FAILED_0059a194 + iVar10 + 2) * 2]
                        ].frame_counter <= DAT_0059d868)) {
      DAT_0059d868 = 0;
    }
    DAT_00749ed4 = game_state.offset_counter;
    uVar5 = 2;
    if (vstart_related
        [(short)obj_indexes_table
                [*(int *)(s_D3DERR_EXECUTE_CREATE_FAILED_0059a194 + iVar10 + 2) * 2]].index_2 !=
        '\0') {
      uVar5 = 3;
    }
    pvVar3 = vstart_related
             [(short)obj_indexes_table
                     [*(int *)(s_D3DERR_EXECUTE_CREATE_FAILED_0059a194 + iVar10 + 2) * 2]].vfra_ptr;
    uVar9 = (undefined3)((uint)pvVar3 >> 8);
    set_human_anim_tribe_person
              ((&pvVar3->index)[DAT_0059d868],iVar8,iVar1,uVar5,CONCAT31(uVar9,player_tribe_num),
               CONCAT31((int3)((uint)(iVar11 * 0xb + 0x5a6af8) >> 8),
                        obj_related_array[iVar11 + 3].person_type_1),
               CONCAT31(uVar9,obj_related_array[iVar11 + 3].person_type_2));
    return;
  case '\x01':
  case '\x02':
  case '\x05':
    iVar8 = *(int *)(s_D3DERR_EXECUTE_CREATE_FAILED_0059a194 + iVar10 + 2);
    local_7a = *(undefined2 *)(unit_type_array_building + iVar8);
    if (cVar2 == '\x02') {
      local_7a = *(undefined2 *)&unit_type_array_vehicle[iVar8].field_0x4;
    }
    else if (cVar2 == '\x05') {
      local_7a = unit_type_array_scenery[iVar8].obj_index;
      if (DAT_0059d860 == 1) {
        uVar6 = pseudo_random * 0x24a1 + 0x24df;
        pseudo_random = uVar6 >> 0xd | uVar6 * 0x80000;
        DAT_0059d86c = pseudo_random % 6;
        DAT_0059d860 = 0;
      }
      if (iVar8 == 1) {
        local_7a = unit_type_array_scenery[DAT_0059d86c + 1].obj_index;
      }
      else if (iVar8 == 9) {
        local_7a = (undefined2)
                   *(undefined4 *)(s_D3DERR_EXECUTE_CREATE_FAILED_0059a194 + iVar10 + 10);
      }
    }
    local_7e = DAT_00749e38 + DAT_00749e3c / 2;
    local_7c = DAT_00749e3a + (short)((DAT_00749e3e * 2) / 3);
    local_84 = ((ushort)game_state.offset_counter & 0x3f) << 5;
    local_88 = *(undefined4 *)(s_D3DERR_EXECUTE_CREATE_FAILED_0059a194 + iVar10 + 6);
    local_80 = 0;
    local_76 = 0;
    local_77 = 0;
    local_82 = 0x74a;
    FUN_00472da0(&local_88);
    return;
  case '\x04':
    puVar7 = (undefined4 *)FUN_0044bd80(2);
    puVar12 = local_74;
    for (iVar8 = 0x1c; iVar8 != 0; iVar8 = iVar8 + -1) {
      *puVar12 = *puVar7;
      puVar7 = puVar7 + 1;
      puVar12 = puVar12 + 1;
    }
    *(undefined1 *)puVar12 = *(undefined1 *)puVar7;
    iVar8 = FUN_0044a240((int)DAT_00749e3c);
    local_3d = FUN_0044a240((int)DAT_00749e38);
    local_3d = (iVar8 - local_2d) / 2 + local_3d;
    iVar8 = FUN_0044a260((int)DAT_00749e3e);
    local_39 = FUN_0044a260((int)DAT_00749e3a);
    local_58 = 0;
    local_5c = 0;
    local_74[3] = 0;
    local_39 = (iVar8 - local_29) / 2 + local_39;
    DAT_0098db08 = s_D3DERR_EXECUTE_CREATE_FAILED_0059a194[DAT_00749e08 * 0xd + 2];
    FUN_0049daf0(local_74);
    DAT_0098db08 = 0;
    return;
  case '\x06':
    local_88 = 0x18;
    local_7a = 0x1e;
    local_82 = 0x74a;
    local_80 = 0;
    local_76 = 0;
    local_77 = 0;
    iVar10 = 0;
    do {
      iVar11 = iVar10 + 0x800;
      sVar4 = (short)((int)(iVar10 + (iVar10 >> 0x1f & 7U)) >> 3);
      local_84 = sVar4 + 0x200U & 0x7ff;
      local_7e = (short)((uint)((int)(DAT_00749e3c / 3) * maybe_cos[sVar4]) >> 0x10) + (short)iVar8;
      local_7c = (short)((uint)((int)(DAT_00749e3e / 3) * maybe_sin[sVar4]) >> 0x10) + (short)iVar1;
      FUN_00472da0(&local_88);
      iVar10 = iVar11;
    } while (iVar11 < 0x4000);
  }
  return;
}
