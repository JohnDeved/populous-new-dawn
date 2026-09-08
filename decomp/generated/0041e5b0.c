/* Ghidra 12.1.3 pseudocode; entry 0041e5b0; draw_polygons_globe.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __fastcall draw_polygons_globe(polygon_drawn *param_1)

{
  undefined4 *puVar1;
  short sVar2;
  short sVar3;
  polygon_drawn *ppVar4;
  undefined1 uVar5;
  polygon_drawn *ppVar6;
  uint uVar7;
  char cVar8;
  int unaff_EBX;
  int iVar9;
  int iVar10;
  int iVar11;
  int iVar12;
  int iStack_30;
  undefined *puStack_2c;
  undefined1 *local_10;
  int local_c;
  undefined1 *local_8;
  int local_4;

  for (ppVar4 = polygons_to_draw[8]; ppVar4 != (polygon_drawn *)0x0; ppVar4 = ppVar4->next) {
    puStack_2c = (undefined *)0x1;
    iVar12 = (int)*(short *)&ppVar4->point_1_y;
    iVar10 = (int)*(short *)((int)&ppVar4->point_1_y + 2);
    iStack_30 = CONCAT31((int3)((uint)ppVar4->point_1_x >> 8),default_icon_offset);
    unaff_EBX = CONCAT31((int3)((uint)unaff_EBX >> 8),
                         global_palette_indexes_2[*(char *)(ppVar4->point_1_x + 0x2f) * 5]);
    FUN_005255b0(iVar12,iVar10,3);
    puStack_2c = (undefined *)0x0;
    iStack_30 = unaff_EBX;
    FUN_005255b0(iVar12,iVar10,3);
    puStack_2c = (undefined *)0x0;
    iStack_30 = unaff_EBX;
    FUN_005255b0(iVar12,iVar10,2);
    param_1 = (polygon_drawn *)0x0;
  }
  ppVar4 = polygons_to_draw[2];
  if (screen_width < 0x141) {
    for (; ppVar6 = polygons_to_draw[3], ppVar4 != (polygon_drawn *)0x0; ppVar4 = ppVar4->next) {
      local_10 = (undefined1 *)&iStack_30;
      sVar2 = *(short *)&ppVar4->point_1_y;
      sVar3 = *(short *)((int)&ppVar4->point_1_y + 2);
      set_indexed_value_from_system_palette
                (unit_type_array_scenery[*(byte *)(ppVar4->point_1_x + 0x2b)].field8_0x10);
      FUN_00527d10((int)sVar2,(int)sVar3);
      param_1 = ppVar4;
    }
    for (; uVar5 = DAT_0089c6f5, ppVar4 = polygons_to_draw[0], ppVar6 != (polygon_drawn *)0x0;
        ppVar6 = ppVar6->next) {
      local_10 = (undefined1 *)&iStack_30;
      sVar2 = *(short *)&ppVar6->point_1_y;
      sVar3 = *(short *)((int)&ppVar6->point_1_y + 2);
      set_indexed_value_from_system_palette
                (unit_type_creature_ARRAY_005a7848[*(byte *)(ppVar6->point_1_x + 0x2b)].field_0x1b);
      FUN_00527d10((int)sVar2,(int)sVar3);
      param_1 = ppVar6;
    }
    for (; DAT_0089c6f5 = uVar5, ppVar6 = polygons_to_draw[7], ppVar4 != (polygon_drawn *)0x0;
        ppVar4 = ppVar4->next) {
      local_10 = (undefined1 *)&iStack_30;
      cVar8 = *(char *)(ppVar4->point_1_x + 0x2f);
      sVar2 = *(short *)&ppVar4->point_1_y;
      sVar3 = *(short *)((int)&ppVar4->point_1_y + 2);
      set_indexed_value_from_system_palette
                (CONCAT31(cVar8 >> 7,global_palette_indexes_2[cVar8 * 5]));
      FUN_00527d10((int)sVar2,(int)sVar3);
      param_1 = (polygon_drawn *)0x0;
      uVar5 = DAT_0089c6f5;
    }
    for (; ppVar4 = polygons_to_draw[5], ppVar6 != (polygon_drawn *)0x0; ppVar6 = ppVar6->next) {
      local_10 = (undefined1 *)&iStack_30;
      sVar2 = *(short *)&ppVar6->point_1_y;
      sVar3 = *(short *)((int)&ppVar6->point_1_y + 2);
      set_indexed_value_from_system_palette(uVar5);
      FUN_00527d10((int)sVar2,(int)sVar3);
      param_1 = ppVar6;
    }
  }
  else {
    for (; ppVar6 = polygons_to_draw[3], ppVar4 != (polygon_drawn *)0x0; ppVar4 = ppVar4->next) {
      local_10 = (undefined1 *)&iStack_30;
      iVar10 = (int)*(short *)&ppVar4->point_1_y;
      iVar12 = (int)*(short *)((int)&ppVar4->point_1_y + 2);
      set_indexed_value_from_system_palette(DAT_0089c6f5);
      add_polygons_globe_no_texture
                (iVar10 + -4,iVar12 + 3,iVar10 + -1,iVar12 + -4,iVar10 + 3,iVar12 + 3);
      set_indexed_value_from_system_palette(DAT_0089c6f7);
      add_polygons_globe_no_texture(iVar10 + -3,iVar12 + 2,iVar10,iVar12 + -3,iVar10 + 2,iVar12 + 2)
      ;
      param_1 = (polygon_drawn *)0x0;
    }
    for (; uVar5 = DAT_0089c6f5, ppVar4 = polygons_to_draw[0], ppVar6 != (polygon_drawn *)0x0;
        ppVar6 = ppVar6->next) {
      local_10 = (undefined1 *)(int)*(short *)&ppVar6->point_1_y;
      local_c = (int)*(short *)((int)&ppVar6->point_1_y + 2);
      local_8 = local_10 + 2;
      local_4 = local_c + 2;
      set_indexed_value_from_system_palette
                (unit_type_creature_ARRAY_005a7848[*(byte *)(ppVar6->point_1_x + 0x2b)].field_0x1b);
      FUN_005169e0(&local_10);
      param_1 = ppVar6;
    }
    while (ppVar6 = polygons_to_draw[7], DAT_0089c6f5 = uVar5, ppVar4 != (polygon_drawn *)0x0) {
      puVar1 = &ppVar4->point_1_x;
      sVar2 = *(short *)((int)&ppVar4->point_1_y + 2);
      puStack_2c = (undefined *)*puVar1;
      sVar3 = *(short *)&ppVar4->point_1_y;
      cVar8 = *(char *)((int)puStack_2c + 0x2b);
      if (cVar8 == '\x01') {
        iStack_30 = CONCAT31((int3)((uint)ppVar4 >> 8),DAT_0089c6fe);
      }
      else if (cVar8 == '\x05') {
        if (*(char *)((int)puStack_2c + 0x2f) == player_tribe_num) {
          iStack_30 = 0x41e78a;
          iVar10 = FUN_004de700();
          if (iVar10 == 0) {
            puStack_2c = (undefined *)*puVar1;
            iStack_30 = 0x41e7c3;
            iVar10 = FUN_004de740();
            iStack_30 = CONCAT31((int3)((uint)iVar10 >> 8),(&DAT_0059bc19)[iVar10 * 4]);
          }
          else {
            puStack_2c = (undefined *)*puVar1;
            if (((byte)game_state.offset_counter_2 & 2) == 0) {
              iStack_30 = 0x41e7af;
              iVar10 = FUN_004de740();
              iStack_30 = CONCAT31((int3)((uint)iVar10 >> 8),(&DAT_0059bc19)[iVar10 * 4]);
            }
            else {
              iStack_30 = CONCAT31((int3)((uint)puStack_2c >> 8),
                                   (&DAT_0059bc19)[*(char *)((int)puStack_2c + 0x2f) * 4]);
            }
          }
        }
        else {
          cVar8 = '\x02';
          iStack_30 = 0x41e779;
          iVar10 = FUN_004de720();
          iStack_30 = CONCAT31((int3)((uint)iVar10 >> 8),(&DAT_0059bc19)[iVar10 * 4]);
        }
      }
      else {
        iStack_30 = CONCAT31(*(char *)((int)puStack_2c + 0x2f) >> 7,
                             (&DAT_0059bc19)[*(char *)((int)puStack_2c + 0x2f) * 4]);
      }
      puStack_2c = (undefined *)0x1;
      FUN_0041f680(*puVar1,(int)sVar3,(int)sVar2,cVar8);
      param_1 = ppVar4->next;
      uVar5 = DAT_0089c6f5;
      ppVar4 = param_1;
    }
    for (; ppVar4 = polygons_to_draw[5], ppVar6 != (polygon_drawn *)0x0; ppVar6 = ppVar6->next) {
      local_10 = (undefined1 *)(int)*(short *)&ppVar6->point_1_y;
      local_c = (int)*(short *)((int)&ppVar6->point_1_y + 2);
      local_8 = local_10 + 2;
      local_4 = local_c + 2;
      set_indexed_value_from_system_palette(uVar5);
      FUN_005169e0(&local_10);
      param_1 = ppVar6;
    }
  }
  while (ppVar6 = polygons_to_draw[6], ppVar4 != (polygon_drawn *)0x0) {
    puStack_2c = (undefined *)0x0;
    iStack_30 = CONCAT31((int3)((uint)param_1 >> 8),*(undefined1 *)(ppVar4->point_1_x + 0x68));
    FUN_005255b0((int)*(short *)&ppVar4->point_1_y,(int)*(short *)((int)&ppVar4->point_1_y + 2),
                 (int)*(short *)(ppVar4->point_1_x + 0x6c));
    param_1 = ppVar4->next;
    ppVar4 = param_1;
  }
  for (; ppVar4 = polygons_to_draw[4], ppVar6 != (polygon_drawn *)0x0; ppVar6 = ppVar6->next) {
    iVar10 = ppVar6->point_1_x;
    if ((char)obj_related_array[*(byte *)(iVar10 + 0x3a) + 3].f1 < '\x02') {
      iVar12 = (int)*(short *)(iVar10 + 0x33);
    }
    else {
      iVar12 = (uint)(*(ushort *)(iVar10 + 0x37) >> 2) + (int)*(short *)(iVar10 + 0x33);
    }
    if (iVar12 != 0x650) {
      puStack_2c = (undefined *)(hfx_0_addr + iVar12 * 8);
      iVar11 = (int)*(short *)&ppVar6->point_1_y - (uint)(*(ushort *)((int)puStack_2c + 4) >> 1);
      iVar9 = (int)*(short *)((int)&ppVar6->point_1_y + 2) - (uint)*(ushort *)((int)puStack_2c + 6);
      if ((*(byte *)(iVar10 + 0x36) & 0x40) != 0) {
        vertices_flags = vertices_flags | 8;
      }
      cVar8 = *(char *)(iVar10 + 0x3c);
      if (cVar8 < -0xf) {
        iStack_30 = iVar9;
        add_polygon_rect_sprite(iVar11);
      }
      else if (cVar8 < '\x10') {
        if (cVar8 == '\x0f') {
          puStack_2c = al0_mem;
        }
        else {
          puStack_2c = al0_mem + cVar8 * 0x1000;
        }
        iStack_30 = 0x41eaaf;
        set_vertex_palette_color();
        vertices_flags = vertices_flags | 8;
        puStack_2c = (undefined *)(hfx_0_addr + iVar12 * 8);
        iStack_30 = iVar9;
        add_polygon_rect_sprite(iVar11);
        puStack_2c = &ghost0_mem;
        iStack_30 = 0x41ead5;
        set_vertex_palette_color();
        vertices_flags = vertices_flags & 0xfffffff7;
      }
      vertices_flags = vertices_flags & 0xfffffff7;
    }
  }
  for (; ppVar6 = polygons_to_draw[9], ppVar4 != (polygon_drawn *)0x0; ppVar4 = ppVar4->next) {
    uVar7 = (uint)*(ushort *)(ppVar4->point_1_x + 0x68);
    iVar10 = uVar7 * 0x9e;
    puStack_2c = &DAT_00895fb9 + iVar10;
    *(short *)(&DAT_00895fc7 + iVar10) =
         *(short *)&ppVar4->point_1_y - ((short)(&DAT_00895fcb)[uVar7 * 0x4f] >> 1);
    *(short *)(&DAT_00895fc9 + iVar10) =
         *(short *)((int)&ppVar4->point_1_y + 2) - (&DAT_00895fcd)[uVar7 * 0x4f];
    iStack_30 = 0x41eb60;
    FUN_00504b70();
  }
  for (; ppVar6 != (polygon_drawn *)0x0; ppVar6 = ppVar6->next) {
    iStack_30 = (int)*(short *)((int)&ppVar6->point_1_y + 2) - (uint)*(ushort *)(hfx_0_addr + 0x1de)
    ;
    if ((*(byte *)(ppVar6->point_1_x + 0x2e) & 4) != 0) {
      puStack_2c = (undefined *)(hfx_0_addr + 0x1d8);
      add_polygon_rect_sprite
                ((int)*(short *)&ppVar6->point_1_y - (uint)(*(ushort *)(hfx_0_addr + 0x1dc) >> 1));
    }
  }
  return;
}
