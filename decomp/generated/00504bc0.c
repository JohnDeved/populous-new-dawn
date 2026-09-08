/* Ghidra 12.1.3 pseudocode; entry 00504bc0; draw_ui_panel.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void draw_ui_panel(int param_1,int *param_2,short param_3,short param_4,undefined2 *param_5,
                  short *param_6,char param_7,char param_8)

{
  byte bVar1;
  short sVar2;
  ushort uVar3;
  unit_struct *puVar4;
  undefined4 uVar5;
  bool bVar6;
  bool bVar7;
  undefined1 uVar8;
  undefined1 uVar9;
  undefined1 uVar10;
  undefined1 uVar11;
  char cVar12;
  int *piVar13;
  undefined1 *puVar14;
  int iVar15;
  int iVar16;
  int iVar17;
  uint uVar18;
  int iVar19;
  undefined3 uVar21;
  undefined1 *puVar20;
  undefined1 *puVar22;
  int *piVar23;
  undefined1 *puVar24;
  uint uVar25;
  unit_struct *puVar26;
  int *piStack_120;
  int *piStack_11c;
  char local_104;
  char cStack_102;
  char cStack_101;
  char cStack_100;
  short sStack_fc;
  char cStack_fa;
  char cStack_f9;
  undefined2 local_f8;
  uint local_f4;
  int local_f0;
  undefined1 *local_ec;
  int *local_e8;
  undefined1 *local_e4;
  undefined1 *local_e0;
  int local_dc;
  int local_d8;
  undefined1 *local_d4;
  undefined1 *local_d0;
  undefined1 *local_cc;
  int *local_c8;
  undefined1 *local_c4;
  undefined1 *local_c0;
  undefined1 *local_bc;
  uint local_b8;
  uint local_b4;
  unit_struct *local_b0;
  undefined1 *local_ac;
  int local_a8;
  int local_a4;
  uint local_a0;
  unit_struct *local_9c;
  uint local_98;
  int local_94;
  uint local_90;
  uint local_8c;
  uint local_88;
  uint local_84;
  int local_80;
  undefined1 *local_7c;
  undefined1 *local_78;
  undefined1 *local_74;
  uint local_70;
  int local_6c;
  int local_68;
  int local_64;
  int local_60;
  uint local_5c;
  int *local_58;
  int local_54;
  uint local_50;
  int local_4c;
  uint local_48;
  uint local_44;
  uint local_40;
  int local_3c;
  int local_38;
  uint local_34;
  uint local_30;
  uint local_2c;
  int local_28 [8];
  int local_8 [2];

  local_9c = unit_land_array[*(ushort *)(param_1 + 10)];
  local_b0 = (unit_struct *)0x0;
  local_88 = (uint)*(ushort *)(hfx_0_addr + 0x25c);
  local_70 = (uint)*(ushort *)(hfx_0_addr + 0x25e);
  local_30 = (uint)*(ushort *)(hfx_0_addr + 0x144);
  local_34 = (uint)*(ushort *)(hfx_0_addr + 0x146);
  local_cc = (undefined1 *)(uint)*(ushort *)(hfx_0_addr + 0x104);
  local_48 = (uint)*(ushort *)(hfx_0_addr + 0x106);
  local_6c = 0;
  local_2c = (uint)*(ushort *)(hfx_0_addr + 0x1a4);
  local_8c = 0;
  sVar2 = *(short *)(hfx_0_addr + 0x1a6);
  local_98 = 0;
  local_40 = 0;
  local_74 = (undefined1 *)0x0;
  local_e0 = (undefined1 *)0x0;
  local_7c = (undefined1 *)0x0;
  local_a0 = 0;
  local_68 = 0;
  local_f4 = 0;
  local_84 = 0;
  local_b4 = 0;
  local_b8 = 0;
  local_90 = 0;
  local_64 = 0;
  local_94 = 0;
  local_a8 = 0;
  local_54 = 0;
  local_a4 = 0;
  local_38 = 0;
  local_3c = 0;
  local_4c = 0;
  cStack_100 = '\0';
  cStack_101 = '\0';
  local_104 = '\0';
  bVar7 = false;
  cStack_102 = '\x01';
  if (param_8 != '\0') {
    local_dc = screen_coord_3_x;
    local_d8 = screen_coord_3_y;
    if (draw_mode != 2) {
      local_dc = screen_coord_3_x - vconfig_struct_0088f004.x;
      local_d8 = screen_coord_3_y - vconfig_struct_0088f004.y;
    }
  }
  iVar19 = local_9c->coord_scale_3 - 1;
  switch(iVar19) {
  case 0:
    uVar3 = *(ushort *)((int)param_2 + 0x92);
    local_98 = (uint)(short)uVar3;
    local_8c = (uint)*(byte *)((int)param_2 + 0x9a);
    local_f4 = (uint)*(ushort *)&unit_type_array_building[*(byte *)((int)param_2 + 0x9e)].field_0x14
    ;
    local_40 = (uint)(*(short *)((int)param_2 + 0x96) / 100);
    local_84 = *(ushort *)&unit_type_array_building[*(byte *)((int)param_2 + 0x9e)].field_0x1a / 100
    ;
    puVar26 = (unit_struct *)0x0;
    if (((uVar3 != 0) && (puVar4 = unit_land_array[uVar3], (*(byte *)&puVar4->flags_2 & 1) == 0)) &&
       (puVar4->unit_class != '\0')) {
      puVar26 = puVar4;
    }
    if ((puVar26 != (unit_struct *)0x0) && ((puVar26->field_0x9d & 0x80) != 0)) {
      cStack_100 = '\x01';
    }
    if ((*(byte *)((int)param_2 + 0x15) & 0x10) != 0) {
      bVar7 = true;
    }
    break;
  case 1:
    if (*(char *)((int)param_2 + 0xa7) == '\0') {
      local_6c = 1;
      local_28[0] = 0x27;
    }
    else {
      piStack_11c = local_28;
      piStack_120 = local_8;
      cVar12 = FUN_004369f0(param_2);
      local_6c = (int)cVar12;
    }
    local_74 = (undefined1 *)(int)*(short *)((int)param_2 + 0x6e);
    local_b4 = (uint)(short)param_2[0x1b];
    break;
  case 2:
  case 0xc:
    local_f8 = CONCAT11((char)((ushort)*(undefined2 *)((int)param_2 + 0x3f) >> 8),
                        (char)((ushort)*(undefined2 *)((int)param_2 + 0x3d) >> 8));
    for (local_b0 = unit_land_array
                    [(short)(&game_state.level_data[0].unit_index)
                            [((local_f8 & 0xfe) * 2 | local_f8 & 0xfe00) * 2]];
        local_b0 != (unit_struct *)0x0; local_b0 = unit_land_array[local_b0->next_unit_index]) {
      if ((local_b0->unit_class == '\x06') && (local_b0->unit_type == '\x06')) goto LAB_00504f01;
    }
    local_b0 = (unit_struct *)0x0;
LAB_00504f01:
    if (local_b0 != (unit_struct *)0x0) {
      local_8c = (uint)(short)(&local_b0->loc_3_x)[player_tribe_num];
      local_f4 = (uint)(short)local_b0->loc_4_y;
      local_e0 = *(undefined1 **)&local_b0->field_0x96;
      local_b8 = *(int *)&local_b0->field_0x9a * local_f4 * local_f4;
      local_78 = (undefined1 *)0x362;
      if ((local_b0->field_0x6d & 1) == 0) {
        cStack_102 = '\0';
        local_78 = (undefined1 *)0x363;
        local_b8 = (uint)local_b0->facs0_index;
        if (local_b0->loc_4_z == 0) {
          local_e0 = (undefined1 *)0x0;
        }
        else {
          local_e0 = (undefined1 *)(local_b8 - (int)(short)local_b0->loc_4_z);
        }
      }
    }
    break;
  case 3:
    local_84 = (uint)(*(short *)((int)&local_9c->coord_scale_4 + 2) / 100);
    local_40 = local_84;
    break;
  case 4:
    local_98 = 1;
    local_8c = (uint)*(char *)((int)param_2 + 0xa6);
    local_f4 = (uint)(byte)unit_type_array_building[*(byte *)((int)param_2 + 0x2b)].field31_0x20;
    if ((*(ushort *)(param_2 + 0x27) & 0x80) != 0) {
      local_7c = (undefined1 *)((uint)*(ushort *)(param_2 + 0x26) << 0xc);
      local_64 = (uint)*(ushort *)((int)param_2 + 0x96) << 0xc;
      if ((*(byte *)((int)param_2 + 0x15) & 0x10) != 0) {
        bVar7 = true;
      }
    }
    if ((*(ushort *)(param_2 + 0x27) & 0x8000) != 0) {
      cStack_100 = '\x01';
    }
    break;
  case 5:
    local_98 = 1;
    local_8c = (uint)*(char *)((int)param_2 + 0xa6);
    local_f4 = (uint)(byte)unit_type_array_building[*(byte *)((int)param_2 + 0x2b)].field31_0x20;
    local_40 = (uint)(short)((short)param_2[0x29] / 100);
    local_84 = (uint)(*(short *)&unit_type_array_vehicle
                                 [(byte)unit_type_array_building[*(byte *)((int)param_2 + 0x2b)].
                                        unit_type1].field_0x13 / 100);
    if ((*(byte *)((int)param_2 + 0x9d) & 0x80) != 0) {
      cStack_100 = '\x01';
    }
    break;
  case 6:
    local_98 = (uint)(player_tribe_num == *(char *)((int)param_2 + 0x2f));
    bVar1 = *(byte *)((int)param_2 + 0x2b);
    uVar21 = (undefined3)((uint)iVar19 >> 8);
    local_8c = (uint)*(char *)((int)param_2 + 0xa6);
    local_f4 = (uint)(byte)unit_type_array_building[bVar1].field31_0x20;
    if ((local_9c->coord_scale_1 & 1) != 0) {
      local_68 = (int)(short)param_2[0x28];
      local_a8 = (int)*(short *)&unit_type_array_building[bVar1].field_0x36;
      if ((*(byte *)((int)param_2 + 0x15) & 0x10) != 0) {
        bVar7 = true;
      }
    }
    if ((local_9c->coord_scale_1 & 2) != 0) {
      local_a0 = (uint)(short)param_2[0x29];
      piStack_120 = (int *)CONCAT31(uVar21,*(undefined1 *)((int)param_2 + 0x2f));
      piStack_11c = (int *)CONCAT31(uVar21,bVar1);
      local_90 = FUN_0041b3f0();
    }
    if ((*(char *)((int)param_2 + 0x2f) == player_tribe_num) &&
       ((*(byte *)((int)param_2 + 0x9d) & 0x80) != 0)) {
      cStack_100 = '\x01';
    }
    break;
  default:
    break;
  case 8:
    local_8c = (uint)*(char *)((int)param_2 + 0x9e);
    cStack_101 = '\x01';
    local_f4 = (uint)(char)unit_type_array_vehicle[*(byte *)((int)param_2 + 0x2b)].field_0x8;
    if (local_8c != 0) {
      piStack_11c = (int *)0x1;
      piStack_120 = (int *)0x0;
      cVar12 = FUN_00466f30(param_2);
      if (cVar12 != '\0') {
        local_104 = '\x01';
      }
    }
    break;
  case 9:
    local_f4 = 1;
    local_8c = (uint)(*(short *)&local_9c->field_0x6c != 0);
    break;
  case 10:
    local_f4 = 1;
    local_8c = (uint)(*(short *)&local_9c->field_0x6e != 0);
    break;
  case 0xb:
    local_8c = (uint)(short)param_2[0x1c];
    local_f4 = DAT_005aa4d0;
    break;
  case 0xd:
    local_8c = (uint)*(char *)((int)param_2 + 0xa6);
    local_f4 = (uint)(byte)unit_type_array_building[*(byte *)((int)param_2 + 0x2b)].field31_0x20;
  }
  if ((load_level_flags._3_1_ & 4) != 0) {
    local_98 = 0;
    cStack_100 = '\0';
  }
  local_44 = (uint)*(ushort *)(hfx_0_addr + 0x174);
  local_5c = (uint)*(ushort *)(hfx_0_addr + 0x1e4);
  if (local_90 != 0) {
    local_94 = 6;
  }
  if (local_a8 != 0) {
    local_94 = local_94 + 6;
  }
  if (local_b4 != 0) {
    local_94 = local_94 + 6;
  }
  if (local_b8 != 0) {
    local_94 = local_94 + 6;
  }
  if (local_f4 != 0) {
    if ((local_9c->coord_scale_3 == 10) || (local_9c->coord_scale_3 == 0xb)) {
LAB_00505367:
      if ((int)local_f4 < 8) goto LAB_005053a2;
      if (local_98 == 0) {
        local_54 = ((int)local_f4 / 2) * (local_88 + 1);
      }
      else {
        local_54 = ((int)local_f4 / 2 + 1) * (local_88 + 1);
      }
    }
    else {
      if (7 < (int)local_f4) {
        local_f4 = local_f4 + 1 & 0xfffffffe;
        goto LAB_00505367;
      }
LAB_005053a2:
      local_54 = (local_88 + 1) * local_f4;
    }
    local_54 = local_54 + 4;
  }
  if (local_84 != 0) {
    local_38 = (local_30 + 1) * local_84 + 4;
  }
  local_60 = local_38;
  if (local_38 <= local_54) {
    local_60 = local_54;
  }
  local_94 = local_94 + local_60;
  if ((local_98 != 0) && (local_3c = local_44 + 4, (int)local_f4 < 8)) {
    local_94 = local_94 + local_3c;
  }
  if (cStack_101 != '\0') {
    local_94 = local_5c + 4 + local_94;
  }
  local_50 = local_94;
  if (local_6c != 0) {
    local_4c = 2;
    if (0 < local_6c) {
      piVar13 = local_28;
      iVar19 = local_6c;
      do {
        iVar17 = *piVar13;
        piVar13 = piVar13 + 1;
        local_4c = local_4c + *(ushort *)(hfx_0_addr + 4 + iVar17 * 8) + 1;
        iVar19 = iVar19 + -1;
      } while (iVar19 != 0);
    }
    local_4c = local_4c + 2;
    local_50 = local_94 + (int)local_cc * 8 + 0xc;
    local_94 = local_94 + local_4c;
  }
  local_50 = local_50 + 7 & 0xfffffff8;
  if (local_f4 != 0) {
    if ((local_98 == 0) || (local_a4 = 2, (int)local_f4 < 8)) {
      local_a4 = 1;
    }
    local_a4 = (local_70 + 5) * local_a4;
  }
  if (local_84 != 0) {
    local_a4 = local_34 + 5 + local_a4;
  }
  if (local_6c != 0) {
    local_a4 = local_48 + 5 + local_a4;
  }
  if (local_64 != 0) {
    local_a4 = local_a4 + 6;
  }
  if (param_5 != (undefined2 *)0x0) {
    *param_5 = (undefined2)local_50;
  }
  if (param_6 != (short *)0x0) {
    *param_6 = sVar2 + (short)local_a4;
  }
  uVar11 = DAT_0089c6f7;
  uVar10 = DAT_0089c6f6;
  uVar9 = DAT_0089c6f5;
  uVar8 = global_palette_indexes;
  if (param_7 != '\0') {
    return;
  }
  puVar14 = (undefined1 *)(int)(short)(param_3 + (short)((int)(local_50 - local_94) / 2));
  local_80 = (int)param_4;
  sStack_fc = param_4;
  cStack_fa = (char)(param_4 >> 0xf);
  cStack_f9 = cStack_fa;
  local_ac = puVar14;
  if (local_64 != 0) {
    vertices_flags = vertices_flags | 0x10;
    puVar20 = puVar14 + 1;
    local_c8 = (int *)(local_80 + 1);
    local_e8 = (int *)(puVar14 + local_94);
    puVar24 = (undefined1 *)((int)local_e8 + -1);
    puVar22 = (undefined1 *)(local_80 + 5);
    local_cc = puVar20;
    local_c4 = puVar24;
    local_c0 = puVar22;
    local_58 = local_c8;
    set_indexed_value_from_system_palette(0x9a);
    FUN_00516890(&local_cc);
    local_e4 = (undefined1 *)(local_80 + 6);
    local_d4 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    set_texture_4(local_ac,local_80,local_ac,local_e4);
    local_ec = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    set_texture_4(local_ac,local_80,local_e8,local_80);
    local_d0 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar24,local_80,puVar24,puVar22);
    local_bc = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(local_ac,puVar22,local_e8,puVar22);
    vertices_flags = vertices_flags & 0xffffffef;
    iVar19 = local_94 + -2;
    if ((!bVar7) || (DAT_00897989 != '\0')) {
      cVar12 = '\0';
      iVar15 = local_64 / iVar19;
      iVar17 = local_64 / iVar19;
      while (iVar16 = iVar15, iVar19 < iVar16) {
        cVar12 = cVar12 + '\x01';
        iVar17 = iVar16;
        iVar15 = iVar16 / iVar19;
      }
      local_ec = (undefined1 *)CONCAT31(local_ec._1_3_,-0x10 - cVar12);
      if (iVar17 < local_64) {
        iVar15 = (int)local_58 + 3;
        do {
          if (0xef < (byte)local_ec) {
            local_ec = (undefined1 *)CONCAT31(local_ec._1_3_,0xef);
          }
          iVar16 = (((int)local_7c % iVar17) * iVar19) / iVar17;
          if (iVar19 < iVar16) {
            iVar16 = iVar19;
          }
          local_d4 = (undefined1 *)&piStack_120;
          local_c4 = puVar20 + iVar16;
          local_c8 = local_58;
          local_cc = puVar20;
          local_c0 = (undefined1 *)iVar15;
          set_indexed_value_from_system_palette(local_ec);
          FUN_00516890(&local_cc);
          local_ec = (undefined1 *)CONCAT31(local_ec._1_3_,(byte)local_ec + '\x01');
          iVar17 = iVar19 * iVar17;
        } while (iVar17 < local_64);
      }
      iVar17 = iVar19;
      if (0 < local_64) {
        iVar17 = ((int)local_7c * iVar19) / local_64;
      }
      if (iVar19 < iVar17) {
        iVar17 = iVar19;
      }
      local_c4 = puVar20 + iVar17;
      local_c0 = (undefined1 *)((int)local_58 + 3);
      local_c8 = local_58;
      local_cc = puVar20;
      set_indexed_value_from_system_palette(global_palette_indexes_2[player_tribe_num * 5 + 4]);
      FUN_00516890(&local_cc);
    }
    if ((((param_8 != '\0') && ((int)puVar20 <= local_dc)) && (local_dc <= (int)(puVar20 + iVar19)))
       && (((int)local_58 <= local_d8 && (local_d8 <= (int)local_58 + 3)))) {
      DAT_0098db2c = 0x35f;
    }
    sStack_fc = (short)local_e4;
    cStack_fa = (char)((uint)local_e4 >> 0x10);
    cStack_f9 = (char)((uint)local_e4 >> 0x18);
  }
  puVar24 = local_ac;
  if (local_90 != 0) {
    vertices_flags = vertices_flags | 0x10;
    puVar20 = local_ac + 1;
    local_e4 = local_ac + 5;
    local_e8 = (int *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + 1);
    iVar17 = local_a4 + CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    iVar19 = iVar17 + -1;
    local_cc = puVar20;
    local_c8 = local_e8;
    local_c4 = local_e4;
    local_c0 = (undefined1 *)iVar19;
    set_indexed_value_from_system_palette(0x9a);
    FUN_00516890(&local_cc);
    local_d4 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    set_texture_4(local_ac,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),local_ac,iVar17);
    puVar14 = local_ac + 6;
    local_ec = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    uVar5 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    set_texture_4(local_ac,uVar5,puVar14,uVar5);
    local_d0 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(local_e4,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),local_e4,iVar19);
    local_bc = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(local_ac,iVar19,puVar14,iVar19);
    vertices_flags = vertices_flags & 0xffffffef;
    iVar19 = local_a4 + -2;
    uVar18 = local_a0;
    if ((int)local_a0 < 1) {
      uVar18 = 0;
    }
    local_c4 = puVar24 + 5;
    local_c8 = (int *)((iVar19 - (int)(uVar18 * iVar19) / (int)local_90) + (int)local_e8);
    puVar22 = (undefined1 *)((int)local_e8 + iVar19);
    local_cc = puVar20;
    local_c0 = puVar22;
    set_indexed_value_from_system_palette(CONCAT13(uVar10,CONCAT12(uVar8,CONCAT11(uVar10,uVar11))));
    FUN_00516890(&local_cc);
    if (((param_8 != '\0') && ((int)puVar20 <= local_dc)) &&
       ((local_dc <= (int)(puVar24 + 7) &&
        (((int)local_e8 <= local_d8 && (local_d8 <= (int)puVar22)))))) {
      DAT_0098db2c = 0x35e;
    }
  }
  if (local_a8 != 0) {
    puVar24 = puVar14 + 1;
    local_c4 = puVar14 + 5;
    vertices_flags = vertices_flags | 0x10;
    local_e8 = (int *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + 1);
    local_e4 = (undefined1 *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + local_a4);
    puVar20 = local_e4 + -1;
    local_cc = puVar24;
    local_c8 = local_e8;
    local_c0 = puVar20;
    set_indexed_value_from_system_palette(0x9a);
    FUN_00516890(&local_cc);
    local_d4 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    set_texture_4(puVar14,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14,local_e4);
    local_ec = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    uVar5 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    set_texture_4(puVar14,uVar5,puVar14 + 6,uVar5);
    local_d0 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar14 + 5,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14 + 5,puVar20)
    ;
    local_bc = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar14,puVar20,puVar14 + 6,puVar20);
    vertices_flags = vertices_flags & 0xffffffef;
    iVar19 = local_a4 + -2;
    if ((!bVar7) || (DAT_00897989 != '\0')) {
      iVar17 = local_68;
      if (local_68 < 1) {
        iVar17 = 0;
      }
      local_c4 = puVar14 + 5;
      local_c8 = (int *)((iVar19 - (iVar17 * iVar19) / local_a8) + (int)local_e8);
      local_c0 = (undefined1 *)((int)local_e8 + iVar19);
      local_cc = puVar24;
      set_indexed_value_from_system_palette
                (CONCAT13(local_104,CONCAT12(uVar10,CONCAT11(uVar8,uVar10))));
      FUN_00516890(&local_cc);
    }
    if ((((param_8 != '\0') && ((int)puVar24 <= local_dc)) && (local_dc <= (int)(puVar14 + 7))) &&
       (((int)local_e8 <= local_d8 && (local_d8 <= iVar19 + (int)local_e8)))) {
      DAT_0098db2c = 0x361;
    }
    puVar14 = puVar14 + 6;
  }
  if (local_b4 != 0) {
    puVar24 = puVar14 + 1;
    local_c4 = puVar14 + 5;
    vertices_flags = vertices_flags | 0x10;
    local_e8 = (int *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + 1);
    local_e4 = (undefined1 *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + local_a4);
    puVar20 = local_e4 + -1;
    local_cc = puVar24;
    local_c8 = local_e8;
    local_c0 = puVar20;
    set_indexed_value_from_system_palette(0x9a);
    FUN_00516890(&local_cc);
    local_d4 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    set_texture_4(puVar14,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14,local_e4);
    local_ec = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    uVar5 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    set_texture_4(puVar14,uVar5,puVar14 + 6,uVar5);
    local_d0 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar14 + 5,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14 + 5,puVar20)
    ;
    local_bc = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar14,puVar20,puVar14 + 6,puVar20);
    vertices_flags = vertices_flags & 0xffffffef;
    iVar19 = local_a4 + -2;
    puVar20 = local_74;
    if ((int)local_74 < 1) {
      puVar20 = (undefined1 *)0x0;
    }
    local_c4 = puVar14 + 5;
    local_c8 = (int *)((iVar19 - ((int)puVar20 * iVar19) / (int)local_b4) + (int)local_e8);
    puVar20 = (undefined1 *)((int)local_e8 + iVar19);
    local_cc = puVar24;
    local_c0 = puVar20;
    set_indexed_value_from_system_palette
              (CONCAT13(uVar8,CONCAT12(local_104,CONCAT11(uVar10,uVar8))));
    FUN_00516890(&local_cc);
    if (((param_8 != '\0') && ((int)puVar24 <= local_dc)) &&
       ((local_dc <= (int)(puVar14 + 7) &&
        (((int)local_e8 <= local_d8 && (local_d8 <= (int)puVar20)))))) {
      DAT_0098db2c = 0x355;
    }
    puVar14 = puVar14 + 6;
  }
  if (local_b8 != 0) {
    puVar24 = puVar14 + 1;
    local_c4 = puVar14 + 5;
    vertices_flags = vertices_flags | 0x10;
    local_e8 = (int *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + 1);
    local_e4 = (undefined1 *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + local_a4);
    puVar20 = local_e4 + -1;
    local_cc = puVar24;
    local_c8 = local_e8;
    local_c0 = puVar20;
    set_indexed_value_from_system_palette(0x9a);
    FUN_00516890(&local_cc);
    local_d4 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    set_texture_4(puVar14,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14,local_e4);
    local_ec = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    uVar5 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    set_texture_4(puVar14,uVar5,puVar14 + 6,uVar5);
    local_d0 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar14 + 5,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14 + 5,puVar20)
    ;
    local_bc = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar14,puVar20,puVar14 + 6,puVar20);
    vertices_flags = vertices_flags & 0xffffffef;
    iVar19 = local_a4 + -2;
    puVar20 = local_e0;
    if ((int)local_e0 < 1) {
      puVar20 = (undefined1 *)0x0;
    }
    local_c4 = puVar14 + 5;
    local_c8 = (int *)((iVar19 - ((int)puVar20 * iVar19) / (int)local_b8) + (int)local_e8);
    puVar20 = (undefined1 *)((int)local_e8 + iVar19);
    local_cc = puVar24;
    local_c0 = puVar20;
    set_indexed_value_from_system_palette
              (CONCAT13(cStack_102,CONCAT12(uVar8,CONCAT11(local_104,uVar10))));
    FUN_00516890(&local_cc);
    if ((((param_8 != '\0') && ((int)puVar24 <= local_dc)) && (local_dc <= (int)(puVar14 + 7))) &&
       (((int)local_e8 <= local_d8 && (local_d8 <= (int)puVar20)))) {
      DAT_0098db2c = (short)local_78;
    }
    puVar14 = puVar14 + 6;
  }
  local_e0 = puVar14;
  if (local_6c != 0) {
    local_cc = puVar14 + 1;
    local_78 = (undefined1 *)(local_48 + 5);
    vertices_flags = vertices_flags | 0x10;
    local_e8 = (int *)(puVar14 + local_4c);
    puVar24 = (undefined1 *)((int)local_e8 + -1);
    local_c8 = (int *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + 1);
    local_e4 = local_78 + CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    puVar20 = local_e4 + -1;
    local_c4 = puVar24;
    local_c0 = puVar20;
    set_indexed_value_from_system_palette(0x9a);
    FUN_00516890(&local_cc);
    local_d4 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    set_texture_4(puVar14,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14,local_e4);
    local_ec = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    uVar5 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    set_texture_4(puVar14,uVar5,local_e8,uVar5);
    local_d0 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar24,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar24,puVar20);
    local_bc = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar14,puVar20,local_e8,puVar20);
    puVar24 = puVar14 + 2;
    vertices_flags = vertices_flags & 0xffffffef;
    iVar19 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    piVar13 = (int *)(iVar19 + 2);
    if (*(char *)((int)param_2 + 0xa7) == '\0') {
      uVar3 = *(ushort *)(hfx_0_addr + 0x13c);
      local_cc = (undefined1 *)&piStack_120;
      set_indexed_value_from_system_palette(0x96);
      add_ui_polygons(puVar14 + 3,iVar19 + 3,hfx_0_addr + 0x138);
      piStack_11c = (int *)(hfx_0_addr + 0x138);
      piStack_120 = piVar13;
      add_polygon_rect_sprite(puVar24);
      if (((param_8 != '\0') && ((int)puVar24 <= local_dc)) &&
         ((local_dc <= (int)(puVar24 + uVar3) &&
          (((int)piVar13 <= local_d8 && (local_d8 <= (int)(local_48 + (int)piVar13))))))) {
        DAT_0098db2c = 0x354;
      }
    }
    else {
      local_b4 = 0;
      if (0 < local_6c) {
        local_ec = (undefined1 *)(iVar19 + 3);
        do {
          uVar18 = local_b8 >> 8;
          local_b8 = local_b8 & 0xffffff00;
          iVar19 = local_28[local_b4];
          uVar25 = (uint)*(ushort *)(hfx_0_addr + 4 + iVar19 * 8);
          if ((((param_8 != '\0') && ((int)puVar24 <= local_dc)) &&
              (local_dc <= (int)(puVar24 + uVar25))) &&
             (((int)piVar13 <= local_d8 && (local_d8 <= (int)(local_48 + (int)piVar13))))) {
            local_b8 = CONCAT31((int3)uVar18,1);
            DAT_00895fb0 = '\x01';
            DAT_00895fb3 = (undefined2)param_2[9];
            DAT_00895fb5 = (undefined2)local_b4;
            DAT_0098db2c = 0x354;
          }
          if ((char)local_b8 != '\0') {
            local_c4 = puVar24 + uVar25;
            vertices_flags = vertices_flags | 8;
            local_c0 = (undefined1 *)(local_48 + (int)piVar13);
            local_cc = puVar24;
            local_c8 = piVar13;
            set_indexed_value_from_system_palette(0x9a);
            FUN_00516890(&local_cc);
            vertices_flags = vertices_flags & 0xfffffff7;
          }
          local_d4 = (undefined1 *)&piStack_120;
          set_indexed_value_from_system_palette(0x96);
          add_ui_polygons(puVar24 + 1,local_ec,hfx_0_addr + iVar19 * 8);
          piStack_11c = (int *)(hfx_0_addr + iVar19 * 8);
          piStack_120 = piVar13;
          add_polygon_rect_sprite(puVar24);
          if (((char)local_b8 != '\0') && (DAT_00895faf != '\0')) {
            local_d0 = (undefined1 *)&piStack_120;
            set_indexed_value_from_system_palette
                      (CONCAT13(cStack_100,CONCAT12(cStack_101,CONCAT11(cStack_102,uVar8))));
            add_ui_polygons(puVar24,piVar13,hfx_0_addr + iVar19 * 8);
          }
          puVar24 = puVar24 + uVar25 + 1;
          local_b4 = local_b4 + 1;
        } while ((int)local_b4 < local_6c);
      }
    }
    puVar14 = local_78 + local_80;
    sStack_fc = (short)puVar14;
    cStack_fa = (char)((uint)puVar14 >> 0x10);
    cStack_f9 = (char)((uint)puVar14 >> 0x18);
  }
  puVar14 = local_e0;
  if (local_f4 != 0) {
    local_90 = local_f4;
    if (7 < (int)local_f4) {
      if (local_98 == 0) {
        local_90 = (int)local_f4 / 2;
      }
      else {
        local_90 = (int)local_f4 / 2 - 1;
      }
    }
    local_a8 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    iVar19 = local_60;
    if ((local_98 != 0) && (7 < (int)local_f4)) {
      iVar19 = (local_60 - local_44) + -4;
    }
    vertices_flags = vertices_flags | 0x10;
    local_cc = local_e0 + 1;
    local_74 = local_e0 + iVar19;
    piVar13 = (int *)CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    piVar23 = (int *)((int)piVar13 + 1);
    puVar14 = local_74 + -1;
    iVar19 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    puVar24 = (undefined1 *)(iVar19 + 4 + local_70);
    local_68 = iVar19 + 5 + local_70;
    local_c8 = piVar23;
    local_c4 = puVar14;
    local_c0 = puVar24;
    set_indexed_value_from_system_palette(0x9a);
    FUN_00516890(&local_cc);
    local_d4 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    set_texture_4(local_e0,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),local_e0,local_68);
    local_ec = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    uVar5 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    set_texture_4(local_e0,uVar5,local_74,uVar5);
    local_d0 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar14,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14,puVar24);
    local_bc = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(local_e0,puVar24,local_74,puVar24);
    vertices_flags = vertices_flags & 0xffffffef;
    local_b4 = 0;
    local_f0 = 0;
    puVar14 = local_e0 + (local_60 - local_54) / 2 + 1;
    if (0 < (int)local_90) {
      do {
        if ((int)local_8c <= (int)local_b4) {
          if (local_b0 == (unit_struct *)0x0) {
LAB_0050693b:
            cVar12 = *(char *)((int)param_2 + 0x2a);
            local_7c = (undefined1 *)&piStack_120;
            vertices_flags = vertices_flags | 8;
            set_indexed_value_from_system_palette(CONCAT22(sStack_fc,CONCAT11(uVar9,uVar9)));
            iVar19 = ((-(uint)(cVar12 == '\a') & 6) + 0x4b) * 8 + hfx_0_addr;
            goto LAB_00506979;
          }
          if (cStack_102 != '\0') {
            if ((local_b0 == (unit_struct *)0x0) ||
               (((((local_b0->field_0x6d & 0x10) == 0 &&
                  (cVar12 = (char)local_b0->coord_scale_4, cVar12 != '\x03')) && (cVar12 != '\x04'))
                && (cVar12 != '\x05')))) goto LAB_0050693b;
            local_e8 = (int *)&piStack_120;
            vertices_flags = vertices_flags | 8;
            set_indexed_value_from_system_palette(CONCAT22(sStack_fc,CONCAT11(uVar9,uVar9)));
            iVar19 = hfx_0_addr + 0x280;
            goto LAB_00506979;
          }
          local_e4 = (undefined1 *)&piStack_120;
          set_indexed_value_from_system_palette(CONCAT13(cStack_fa,CONCAT21(sStack_fc,uVar9)));
          add_ui_polygons(puVar14 + 1,(int)piVar13 + 2,hfx_0_addr + 600);
          local_78 = (undefined1 *)&piStack_120;
          set_indexed_value_from_system_palette(CONCAT13(cStack_fa,CONCAT21(sStack_fc,uVar9)));
          add_ui_polygons(puVar14,piVar23,hfx_0_addr + 600);
          goto switchD_0050664c_caseD_3;
        }
        puVar26 = (unit_struct *)0x0;
        iVar19 = *(byte *)((int)param_2 + 0x2a) - 2;
        switch(iVar19) {
        case 0:
          if (*(char *)((int)param_2 + 0x2b) == '\x12') {
            puVar4 = game_state.tribes_array[player_tribe_num].shaman;
            if (((puVar4 != (unit_struct *)0x0) && (puVar4->state == '\n')) &&
               (puVar4->field_0xa7 == '!')) {
              puVar26 = puVar4;
            }
          }
          else {
            if (*(char *)((int)param_2 + 0x2b) != '\x13') {
              if (*(char *)((int)param_2 + 0x2f) != player_tribe_num) {
                piStack_11c = (int *)(int)player_tribe_num;
                piStack_120 = param_2;
                iVar19 = FUN_0040b9c0();
                if (iVar19 != 0) {
                  local_f0 = (int)*(short *)&local_9c->field_0x6e;
                  puVar26 = unit_land_array[*(short *)&local_9c->field_0x6e];
                  break;
                }
              }
              sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x86);
              while (sVar2 == 0) {
                local_f0 = local_f0 + 1;
                sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x86);
              }
              uVar18 = (uint)*(short *)((int)param_2 + local_f0 * 2 + 0x86);
              goto LAB_0050662c;
            }
            puVar4 = game_state.tribes_array[player_tribe_num].shaman;
            if (puVar4 != (unit_struct *)0x0) {
              puVar26 = puVar4;
            }
          }
          break;
        case 2:
          sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x7a);
          while (sVar2 == 0) {
            local_f0 = local_f0 + 1;
            sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x7a);
          }
          uVar18 = (uint)*(ushort *)((int)param_2 + local_f0 * 2 + 0x7a);
          goto LAB_0050662c;
        case 3:
          if (local_b0 != (unit_struct *)0x0) {
            piStack_11c = (int *)CONCAT31((int3)((uint)iVar19 >> 8),player_tribe_num);
            piStack_120 = &local_f0;
            puVar26 = (unit_struct *)FUN_0043c600(param_2);
          }
          break;
        case 7:
          sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x6a);
          while (sVar2 == 0) {
            local_f0 = local_f0 + 1;
            sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x6a);
          }
          uVar18 = (uint)*(ushort *)((int)param_2 + local_f0 * 2 + 0x6a);
LAB_0050662c:
          puVar26 = unit_land_array[uVar18];
          break;
        case 8:
          local_f0 = (int)*(short *)&local_9c->field_0x6c;
          puVar26 = unit_land_array[*(short *)&local_9c->field_0x6c];
        }
        switch(*(undefined1 *)((int)param_2 + 0x2a)) {
        case 2:
        case 4:
        case 5:
        case 9:
        case 10:
          if (puVar26 == (unit_struct *)0x0) {
            local_d0 = (undefined1 *)&piStack_120;
            vertices_flags = vertices_flags | 8;
            set_indexed_value_from_system_palette(CONCAT22(sStack_fc,CONCAT11(uVar9,uVar9)));
            iVar19 = hfx_0_addr + 600;
LAB_00506979:
            add_ui_polygons(puVar14,piVar23,iVar19);
            vertices_flags = vertices_flags & 0xfffffff7;
          }
          else {
            local_a0 = (uint)(byte)puVar26->unit_type;
            uVar18 = local_b8 >> 8;
            local_b8 = local_b8 & 0xffffff00;
            if (((puVar26->tribe_index == player_tribe_num) && (param_8 != '\0')) &&
               (((int)puVar14 <= local_dc &&
                (((local_dc <= (int)(puVar14 + local_88) && ((int)piVar23 <= local_d8)) &&
                 (local_d8 <= (int)(local_70 + (int)piVar23))))))) {
              local_b8 = CONCAT31((int3)uVar18,1);
              DAT_00895fb0 = '\x01';
              DAT_00895fb3 = (undefined2)param_2[9];
              DAT_00895fb5 = (undefined2)local_f0;
            }
            if ((char)local_b8 != '\0') {
              local_cc = puVar14 + 1;
              local_c8 = (int *)((int)piVar13 + 2);
              local_c4 = puVar14 + local_88 + 1;
              local_c0 = (undefined1 *)((int)piVar23 + local_70 + 2);
              set_indexed_value_from_system_palette(0x9a);
              FUN_00516890(&local_cc);
            }
            local_d4 = (undefined1 *)&piStack_120;
            local_a0 = local_a0 + 0x49;
            set_indexed_value_from_system_palette(CONCAT13(cStack_fa,CONCAT21(sStack_fc,uVar9)));
            add_ui_polygons(puVar14 + 1,(int)piVar13 + 2,hfx_0_addr + local_a0 * 8);
            piStack_11c = (int *)(hfx_0_addr + local_a0 * 8);
            piStack_120 = piVar23;
            add_polygon_rect_sprite(puVar14);
            if ((*(byte *)&puVar26->loc_1_x & 0x80) != 0) {
              piStack_11c = (int *)(hfx_0_addr + 0x1a8);
              piStack_120 = piVar13;
              add_polygon_rect_sprite
                        (puVar14 + (int)(local_88 - *(ushort *)(hfx_0_addr + 0x1ac)) / 2);
            }
            if (((char)local_b8 != '\0') && (DAT_00895faf != '\0')) {
              local_ec = (undefined1 *)&piStack_120;
              set_indexed_value_from_system_palette
                        (CONCAT13(cStack_100,CONCAT12(cStack_101,CONCAT11(cStack_102,uVar8))));
              add_ui_polygons(puVar14,piVar23,hfx_0_addr + local_a0 * 8);
            }
          }
          break;
        case 7:
          local_bc = (undefined1 *)&piStack_120;
          set_indexed_value_from_system_palette(CONCAT13(cStack_fa,CONCAT21(sStack_fc,uVar9)));
          add_ui_polygons(puVar14 + 1,(int)piVar13 + 2,hfx_0_addr + 0x288);
          piStack_11c = (int *)(hfx_0_addr + 0x288);
          piStack_120 = piVar23;
          add_polygon_rect_sprite(puVar14);
        }
switchD_0050664c_caseD_3:
        local_b4 = local_b4 + 1;
        local_f0 = local_f0 + 1;
        puVar14 = puVar14 + local_88 + 1;
      } while ((int)local_b4 < (int)local_90);
    }
    if (((param_8 != '\0') && ((int)local_e0 <= local_dc)) &&
       ((local_dc <= (int)local_74 && ((local_a8 <= local_d8 && (local_d8 <= local_68)))))) {
      switch(*(undefined1 *)((int)param_2 + 0x2a)) {
      case 2:
        DAT_0098db2c = 0x359;
        break;
      case 4:
        DAT_0098db2c = 0x359;
        break;
      case 5:
        DAT_0098db2c = 0x35b;
        break;
      case 9:
        DAT_0098db2c = 0x358;
        break;
      case 10:
        DAT_0098db2c = 0x35a;
      }
    }
    iVar19 = local_a8;
    if ((local_98 == 0) && (cStack_101 == '\0')) {
      iVar19 = local_68;
    }
    sStack_fc = (short)iVar19;
    cStack_fa = (char)((uint)iVar19 >> 0x10);
    cStack_f9 = (char)((uint)iVar19 >> 0x18);
    puVar14 = local_74;
  }
  puVar24 = puVar14;
  if (local_98 == 0) goto LAB_00506c6c;
  local_cc = puVar14 + 1;
  local_a8 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
  puVar20 = puVar14 + local_44 + 4;
  local_c4 = puVar20 + -1;
  vertices_flags = vertices_flags | 0x10;
  local_c8 = (int *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + 1);
  iVar17 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
  iVar19 = iVar17 + 5 + local_70;
  local_c0 = (undefined1 *)(iVar17 + 4 + local_70);
  local_e4 = puVar14;
  set_indexed_value_from_system_palette(0x9a);
  FUN_00516890(&local_cc);
  local_d4 = (undefined1 *)&piStack_120;
  FUN_004525d0(0x9d);
  set_texture_4(puVar14,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14,iVar19);
  local_ec = (undefined1 *)&piStack_120;
  FUN_004525d0(0x9d);
  uVar5 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
  set_texture_4(puVar14,uVar5,puVar20,uVar5);
  local_d0 = (undefined1 *)&piStack_120;
  FUN_004525d0(0x96);
  set_texture_4(puVar20 + -1,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar20 + -1,
                iVar19 + -1);
  local_bc = (undefined1 *)&piStack_120;
  FUN_004525d0(0x96);
  puVar24 = puVar14 + 3;
  set_texture_4(puVar14,iVar19 + -1,puVar20,iVar19 + -1);
  vertices_flags = vertices_flags & 0xffffffef;
  piVar13 = (int *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + 3);
  uVar18 = local_b8 >> 8;
  local_b8 = local_b8 & 0xffffff00;
  if ((((param_8 != '\0') && ((int)local_e4 <= local_dc)) && (local_dc <= (int)puVar20)) &&
     ((local_a8 <= local_d8 && (local_d8 <= iVar19)))) {
    local_b8 = CONCAT31((int3)uVar18,1);
    DAT_00895fb0 = '\x01';
    DAT_00895fb3 = (undefined2)param_2[9];
    DAT_00895fb5 = 0xffff;
    DAT_0098db2c = 0x35c;
  }
  if (cStack_100 == '\0') {
    iVar17 = 0x31;
    if ((char)local_b8 == '\0') {
LAB_00506c19:
      piStack_11c = (int *)(iVar17 * 8 + hfx_0_addr);
    }
    else {
      piStack_11c = (int *)(hfx_0_addr + 400);
    }
  }
  else {
    iVar17 = 0x2e;
    if (DAT_00897987 == '\0') goto LAB_00506c19;
    piStack_11c = (int *)(hfx_0_addr + 0x178);
  }
  piStack_120 = piVar13;
  add_polygon_rect_sprite(puVar24);
  if (((char)local_b8 != '\0') && (DAT_00895faf != '\0')) {
    piStack_11c = (int *)(iVar17 * 8 + hfx_0_addr + 0x10);
    piStack_120 = piVar13;
    add_polygon_rect_sprite(puVar24);
  }
  if (cStack_101 != '\0') {
    iVar19 = local_a8;
  }
  sStack_fc = (short)iVar19;
  cStack_fa = (char)((uint)iVar19 >> 0x10);
  cStack_f9 = (char)((uint)iVar19 >> 0x18);
LAB_00506c6c:
  if (cStack_101 != '\0') {
    local_cc = puVar24 + 1;
    local_a8 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    vertices_flags = vertices_flags | 0x10;
    local_c4 = puVar24 + local_5c + 3;
    puVar14 = puVar24 + local_5c + 4;
    local_c8 = (int *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + 1);
    iVar17 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    iVar19 = iVar17 + 5 + local_70;
    local_c0 = (undefined1 *)(iVar17 + 4 + local_70);
    local_e4 = puVar24;
    set_indexed_value_from_system_palette(0x9a);
    FUN_00516890(&local_cc);
    local_d4 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    set_texture_4(puVar24,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar24,iVar19);
    local_ec = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    uVar5 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    set_texture_4(puVar24,uVar5,puVar14,uVar5);
    local_d0 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar14 + -1,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14 + -1,
                  iVar19 + -1);
    local_bc = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar24,iVar19 + -1,puVar14,iVar19 + -1);
    bVar6 = false;
    vertices_flags = vertices_flags & 0xffffffef;
    piStack_120 = (int *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + 3);
    if ((((param_8 != '\0') && ((int)local_e4 <= local_dc)) && (local_dc <= (int)puVar14)) &&
       ((local_a8 <= local_d8 && (local_d8 <= iVar19)))) {
      bVar6 = true;
      DAT_00895fb0 = '\x01';
      DAT_00895fb3 = (undefined2)param_2[9];
      DAT_00895fb5 = 0xfffe;
      DAT_0098db2c = 0x35d;
    }
    if (local_104 == '\0') {
      vertices_flags = vertices_flags | 8;
      iVar17 = 0x3c;
    }
    else if (bVar6) {
      iVar17 = 0x3d;
    }
    else {
      iVar17 = 0x3c;
    }
    piStack_11c = (int *)(iVar17 * 8 + hfx_0_addr);
    add_polygon_rect_sprite(puVar24 + 3);
    vertices_flags = vertices_flags & 0xfffffff7;
    sStack_fc = (short)iVar19;
    cStack_fa = (char)((uint)iVar19 >> 0x10);
    cStack_f9 = (char)((uint)iVar19 >> 0x18);
  }
  if (7 < (int)local_f4) {
    if (local_98 == 0) {
      local_90 = (int)local_f4 / 2;
    }
    else {
      local_90 = (int)local_f4 / 2 - 1;
    }
    local_a8 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    vertices_flags = vertices_flags | 0x10;
    local_cc = local_e0 + 1;
    local_7c = local_e0 + local_60;
    piVar13 = (int *)CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    puVar14 = local_7c + -1;
    piVar23 = (int *)((int)piVar13 + 1);
    iVar19 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    puVar24 = (undefined1 *)(iVar19 + 4 + local_70);
    local_5c = iVar19 + 5 + local_70;
    local_c8 = piVar23;
    local_c4 = puVar14;
    local_c0 = puVar24;
    set_indexed_value_from_system_palette(0x9a);
    FUN_00516890(&local_cc);
    local_d4 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    set_texture_4(local_e0,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),local_e0,local_5c);
    local_ec = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    uVar5 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    set_texture_4(local_e0,uVar5,local_7c,uVar5);
    local_d0 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar14,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14,puVar24);
    local_bc = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(local_e0,puVar24,local_7c,puVar24);
    vertices_flags = vertices_flags & 0xffffffef;
    puVar14 = local_e0 + (local_60 - local_54) / 2 + 1;
    for (local_b4 = local_90; (int)local_b4 < (int)local_f4; local_b4 = local_b4 + 1) {
      if ((int)local_8c <= (int)local_b4) {
        if ((local_b0 == (unit_struct *)0x0) || (cStack_102 != '\0')) {
          cVar12 = *(char *)((int)param_2 + 0x2a);
          local_e8 = (int *)&piStack_120;
          vertices_flags = vertices_flags | 8;
          set_indexed_value_from_system_palette(CONCAT22(sStack_fc,CONCAT11(uVar9,uVar9)));
          iVar19 = ((-(uint)(cVar12 == '\a') & 6) + 0x4b) * 8 + hfx_0_addr;
          goto LAB_005073b9;
        }
        local_e4 = (undefined1 *)&piStack_120;
        set_indexed_value_from_system_palette(CONCAT13(cStack_fa,CONCAT21(sStack_fc,uVar9)));
        add_ui_polygons(puVar14 + 1,(int)piVar13 + 2,hfx_0_addr + 600);
        local_78 = (undefined1 *)&piStack_120;
        set_indexed_value_from_system_palette(CONCAT13(cStack_fa,CONCAT21(sStack_fc,uVar9)));
        add_ui_polygons(puVar14,piVar23,hfx_0_addr + 600);
        goto switchD_005070ef_caseD_3;
      }
      puVar26 = (unit_struct *)0x0;
      iVar19 = *(byte *)((int)param_2 + 0x2a) - 2;
      switch(iVar19) {
      case 0:
        if (*(char *)((int)param_2 + 0x2f) != player_tribe_num) {
          piStack_11c = (int *)(int)player_tribe_num;
          piStack_120 = param_2;
          iVar19 = FUN_0040b9c0();
          if (iVar19 != 0) {
            local_f0 = (int)*(short *)&local_9c->field_0x6e;
            puVar26 = unit_land_array[*(short *)&local_9c->field_0x6e];
            break;
          }
        }
        sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x86);
        while (sVar2 == 0) {
          local_f0 = local_f0 + 1;
          sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x86);
        }
        uVar18 = (uint)*(short *)((int)param_2 + local_f0 * 2 + 0x86);
        goto LAB_005070cf;
      case 2:
        sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x7a);
        while (sVar2 == 0) {
          local_f0 = local_f0 + 1;
          sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x7a);
        }
        puVar26 = unit_land_array[*(ushort *)((int)param_2 + local_f0 * 2 + 0x7a)];
        break;
      case 3:
        if (local_b0 != (unit_struct *)0x0) {
          piStack_11c = (int *)CONCAT31((int3)((uint)iVar19 >> 8),player_tribe_num);
          piStack_120 = &local_f0;
          puVar26 = (unit_struct *)FUN_0043c600(param_2);
        }
        break;
      case 7:
        sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x6a);
        while (sVar2 == 0) {
          local_f0 = local_f0 + 1;
          sVar2 = *(short *)((int)param_2 + local_f0 * 2 + 0x6a);
        }
        uVar18 = (uint)*(ushort *)((int)param_2 + local_f0 * 2 + 0x6a);
LAB_005070cf:
        puVar26 = unit_land_array[uVar18];
        break;
      case 8:
        local_f0 = (int)*(short *)&local_9c->field_0x6c;
        puVar26 = unit_land_array[*(short *)&local_9c->field_0x6c];
      }
      switch(*(undefined1 *)((int)param_2 + 0x2a)) {
      case 2:
      case 4:
      case 5:
      case 9:
      case 10:
        if (puVar26 == (unit_struct *)0x0) {
          local_d0 = (undefined1 *)&piStack_120;
          vertices_flags = vertices_flags | 8;
          set_indexed_value_from_system_palette(CONCAT22(sStack_fc,CONCAT11(uVar9,uVar9)));
          iVar19 = hfx_0_addr + 600;
LAB_005073b9:
          add_ui_polygons(puVar14,piVar23,iVar19);
          vertices_flags = vertices_flags & 0xfffffff7;
        }
        else {
          local_a0 = (uint)(byte)puVar26->unit_type;
          uVar18 = local_b8 >> 8;
          local_b8 = local_b8 & 0xffffff00;
          if ((((param_8 != '\0') && ((int)puVar14 <= local_dc)) &&
              (local_dc <= (int)(puVar14 + local_88))) &&
             (((int)piVar23 <= local_d8 && (local_d8 <= (int)(local_70 + (int)piVar23))))) {
            local_b8 = CONCAT31((int3)uVar18,1);
            DAT_00895fb0 = '\x01';
            DAT_00895fb3 = (undefined2)param_2[9];
            DAT_00895fb5 = (undefined2)local_f0;
          }
          if ((char)local_b8 != '\0') {
            local_cc = puVar14 + 1;
            local_c8 = (int *)((int)piVar13 + 2);
            local_c4 = puVar14 + local_88 + 1;
            local_c0 = (undefined1 *)((int)piVar23 + local_70 + 2);
            set_indexed_value_from_system_palette(0x9a);
            FUN_00516890(&local_cc);
          }
          local_d4 = (undefined1 *)&piStack_120;
          local_a0 = local_a0 + 0x49;
          set_indexed_value_from_system_palette(CONCAT13(cStack_fa,CONCAT21(sStack_fc,uVar9)));
          add_ui_polygons(puVar14 + 1,(int)piVar13 + 2,hfx_0_addr + local_a0 * 8);
          piStack_11c = (int *)(hfx_0_addr + local_a0 * 8);
          piStack_120 = piVar23;
          add_polygon_rect_sprite(puVar14);
          if ((*(byte *)&puVar26->loc_1_x & 0x80) != 0) {
            piStack_11c = (int *)(hfx_0_addr + 0x1a8);
            piStack_120 = piVar13;
            add_polygon_rect_sprite(puVar14 + (int)(local_88 - *(ushort *)(hfx_0_addr + 0x1ac)) / 2)
            ;
          }
          if (((char)local_b8 != '\0') && (DAT_00895faf != '\0')) {
            local_ec = (undefined1 *)&piStack_120;
            set_indexed_value_from_system_palette
                      (CONCAT13(cStack_100,CONCAT12(cStack_101,CONCAT11(cStack_102,uVar8))));
            add_ui_polygons(puVar14,piVar23,hfx_0_addr + local_a0 * 8);
          }
        }
        break;
      case 7:
        local_bc = (undefined1 *)&piStack_120;
        set_indexed_value_from_system_palette(CONCAT13(cStack_fa,CONCAT21(sStack_fc,uVar9)));
        add_ui_polygons(puVar14 + 1,(int)piVar13 + 2,hfx_0_addr + 0x288);
        piStack_11c = (int *)(hfx_0_addr + 0x288);
        piStack_120 = piVar23;
        add_polygon_rect_sprite(puVar14);
      }
switchD_005070ef_caseD_3:
      local_f0 = local_f0 + 1;
      puVar14 = puVar14 + local_88 + 1;
    }
    if ((((param_8 != '\0') && ((int)local_e0 <= local_dc)) && (local_dc <= (int)local_7c)) &&
       ((local_a8 <= local_d8 && (local_d8 <= (int)local_5c)))) {
      switch(*(undefined1 *)((int)param_2 + 0x2a)) {
      case 2:
        DAT_0098db2c = 0x359;
        break;
      case 4:
        DAT_0098db2c = 0x359;
        break;
      case 5:
        DAT_0098db2c = 0x35b;
        break;
      case 9:
        DAT_0098db2c = 0x358;
        break;
      case 10:
        DAT_0098db2c = 0x35a;
      }
    }
    sStack_fc = (short)local_5c;
    cStack_fa = (char)(local_5c >> 0x10);
    cStack_f9 = (char)(local_5c >> 0x18);
  }
  if (local_84 != 0) {
    local_a8 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    iVar19 = local_60 + local_3c;
    if ((local_98 != 0) && (7 < (int)local_f4)) {
      iVar19 = iVar19 - (local_44 + 4);
    }
    vertices_flags = vertices_flags | 0x10;
    local_cc = local_e0 + 1;
    local_e4 = local_e0 + iVar19;
    puVar14 = local_e4 + -1;
    local_c8 = (int *)(CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)) + 1);
    iVar19 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    puVar24 = (undefined1 *)(iVar19 + 4 + local_34);
    iVar19 = iVar19 + 5 + local_34;
    local_c4 = puVar14;
    local_c0 = puVar24;
    set_indexed_value_from_system_palette(0x9a);
    FUN_00516890(&local_cc);
    local_d4 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    set_texture_4(local_e0,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),local_e0,iVar19);
    local_ec = (undefined1 *)&piStack_120;
    FUN_004525d0(0x9d);
    uVar5 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    set_texture_4(local_e0,uVar5,local_e4,uVar5);
    local_d0 = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    set_texture_4(puVar14,CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc)),puVar14,puVar24);
    local_bc = (undefined1 *)&piStack_120;
    FUN_004525d0(0x96);
    iVar15 = 0;
    set_texture_4(local_e0,puVar24,local_e4,puVar24);
    vertices_flags = vertices_flags & 0xffffffef;
    iVar17 = CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    piVar13 = (int *)(iVar17 + 2);
    sStack_fc = (short)piVar13;
    cStack_fa = (char)((uint)piVar13 >> 0x10);
    puVar14 = local_e0 + (local_60 - local_38) / 2 + 2;
    if (0 < (int)local_84) {
      do {
        if (iVar15 < (int)local_40) {
          local_cc = (undefined1 *)&piStack_120;
          set_indexed_value_from_system_palette(CONCAT13(cStack_fa,CONCAT21(sStack_fc,uVar9)));
          add_ui_polygons(puVar14 + 1,iVar17 + 3,hfx_0_addr + 0x140);
          piStack_11c = (int *)(hfx_0_addr + 0x140);
          piStack_120 = piVar13;
          add_polygon_rect_sprite(puVar14);
        }
        else if ((!bVar7) || (DAT_00897989 != '\0')) {
          vertices_flags = vertices_flags | 8;
          set_indexed_value_from_system_palette(CONCAT22(sStack_fc,CONCAT11(uVar9,uVar9)));
          add_ui_polygons(puVar14,piVar13,hfx_0_addr + 0x140);
          vertices_flags = vertices_flags & 0xfffffff7;
        }
        iVar15 = iVar15 + 1;
        puVar14 = puVar14 + local_30 + 1;
      } while (iVar15 < (int)local_84);
    }
    if ((((param_8 != '\0') && ((int)local_e0 <= local_dc)) && (local_dc <= (int)local_e4)) &&
       ((local_a8 <= local_d8 && (local_d8 <= iVar19)))) {
      cVar12 = *(char *)((int)param_2 + 0x2a);
      if (cVar12 == '\x05') {
        DAT_0098db2c = 0x356;
      }
      else if (cVar12 == '\x01') {
        DAT_0098db2c = 0x353;
      }
      else if (cVar12 == '\t') {
        DAT_0098db2c = 0x357;
      }
    }
    sStack_fc = (short)iVar19;
    cStack_fa = (char)((uint)iVar19 >> 0x10);
    cStack_f9 = (char)((uint)iVar19 >> 0x18);
  }
  if (((local_6c != 0) || (local_f4 != 0)) || (local_84 != 0)) {
    vertices_flags = vertices_flags | 0x10;
    piStack_120 = (int *)CONCAT13(cStack_f9,CONCAT12(cStack_fa,sStack_fc));
    piStack_11c = (int *)(hfx_0_addr + 0x1a0);
    add_polygon_rect_sprite(local_ac + (int)(local_94 - local_2c) / 2);
    vertices_flags = vertices_flags & 0xffffffef;
    if (param_8 != '\0') {
      if (((DAT_00895fb0 != '\0') || (DAT_0098db2c != 0)) && (*(char *)(param_1 + 1) == '\x01')) {
        *(undefined2 *)(param_1 + 6) = *(undefined2 *)(param_1 + 0x1c);
      }
      if (((param_8 != '\0') && ((int)local_ac <= local_dc)) &&
         ((local_dc <= (int)(local_ac + local_50) &&
          ((local_80 <= local_d8 && (local_d8 <= local_80 + local_a4)))))) {
        DAT_00895fb1 = 2;
      }
    }
  }
  return;
}
