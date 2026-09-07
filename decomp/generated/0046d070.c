/* Ghidra 12.1.3 pseudocode; entry 0046d070; draw_units.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void draw_units(void)

{
  pnts_related_struct *ppVar1;
  uint *puVar2;
  polygon_related_8B *ppVar3;
  short sVar4;
  float fVar5;
  bool bVar6;
  undefined2 uVar7;
  uint uVar8;
  int iVar9;
  uint uVar10;
  uint uVar11;
  pnts_related_struct *ppVar12;
  uint uVar13;
  pnts_related_struct *ppVar14;
  float10 fVar15;
  undefined2 local_12;
  int local_c;
  int local_8;

  iVar9 = (int)mesh_render_bounds_ptr->start;
  mesh_generator_counter = mesh_render_bounds_ptr->end - iVar9;
  ppVar14 = landscape_mesh_2 + iVar9;
  ppVar12 = landscape_mesh_1 + iVar9;
  draw_units_land_pos_x._0_1_ =
       (char)mesh_render_bounds_ptr->start * '\x02' + (char)mesh_generator_base_y;
  mesh_generator_curr_x = iVar9 * 0x100 + mesh_generator_base_x;
  local_12 = CONCAT11(draw_units_land_pos_x._1_1_ + -2,(char)draw_units_land_pos_x);
  do {
    if (mesh_generator_counter < 1) {
      return;
    }
    uVar8 = (local_12 & 0xfe) * 2 | local_12 & 0xfe00;
    puVar2 = &game_state.level_data[0].flags + uVar8;
    if (((byte)level_flags & 4) == 0) {
      sVar4 = (&game_state.level_data[0].unit_index)[uVar8 * 2];
joined_r0x0046d128:
      if (sVar4 != 0) {
        draw_unit_on_land_pos(puVar2);
      }
    }
    else {
      _DAT_0087ca4c = _DAT_0087ca4c + 1;
      if ((*puVar2 & 8) != 0) {
        DAT_0087ca50 = DAT_0087ca50 + 1;
        sVar4 = (&game_state.level_data[0].unit_index)[uVar8 * 2];
        goto joined_r0x0046d128;
      }
    }
    local_8 = 0;
    local_c = 0;
    local_12._1_1_ = (undefined1)(local_12 >> 8);
    if (((byte)level_flags & 8) == 0) {
      if ((*puVar2 & 1) == 0) {
        ppVar1 = ppVar12 + 1;
        fVar15 = (float10)screen_clipping(ppVar14,ppVar12,ppVar1);
        if ((float10)_DAT_0058f468 < fVar15) {
          local_8 = add_pnts_polygon(ppVar14,ppVar12,ppVar1,0);
        }
        fVar15 = (float10)screen_clipping(ppVar1,ppVar14 + 1,ppVar14);
        if ((float10)_DAT_0058f468 < fVar15) {
          local_c = add_pnts_polygon(ppVar1,ppVar14 + 1,ppVar14,2);
        }
        iVar9 = polygon_counter_draw_units;
        if (local_8 != 0) {
          ppVar3 = polygon_related_8B_ARRAY_0076108c + polygon_counter_draw_units;
          *(short *)(local_8 + 0x42) = (short)polygon_counter_draw_units;
          polygon_counter_draw_units = polygon_counter_draw_units + 1;
          *(undefined1 *)(local_8 + 0x44) = 0;
          ppVar3->x = (char)local_12;
          polygon_related_8B_ARRAY_0076108c[iVar9].y = local_12._1_1_;
          uVar7 = __ftol();
          polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_1 = uVar7;
          uVar7 = __ftol();
          polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_2 = uVar7;
          polygon_related_8B_ARRAY_0076108c[iVar9].type = 0;
        }
        iVar9 = polygon_counter_draw_units;
        if (local_c != 0) {
          ppVar3 = polygon_related_8B_ARRAY_0076108c + polygon_counter_draw_units;
          *(short *)(local_c + 0x42) = (short)polygon_counter_draw_units;
          polygon_counter_draw_units = polygon_counter_draw_units + 1;
          *(undefined1 *)(local_c + 0x44) = 1;
          ppVar3->x = (char)local_12;
          polygon_related_8B_ARRAY_0076108c[iVar9].y = local_12._1_1_;
          uVar7 = __ftol();
          polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_1 = uVar7;
          uVar7 = __ftol();
          polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_2 = uVar7;
          polygon_related_8B_ARRAY_0076108c[iVar9].type = 2;
        }
      }
      else {
        ppVar1 = ppVar14 + 1;
        fVar15 = (float10)screen_clipping(ppVar1,ppVar14,ppVar12);
        if ((float10)_DAT_0058f468 < fVar15) {
          local_8 = add_pnts_polygon(ppVar1,ppVar14,ppVar12,3);
        }
        fVar15 = (float10)screen_clipping(ppVar12,ppVar12 + 1,ppVar1);
        if ((float10)_DAT_0058f468 < fVar15) {
          local_c = add_pnts_polygon(ppVar12,ppVar12 + 1,ppVar1,1);
        }
        iVar9 = polygon_counter_draw_units;
        if (local_8 != 0) {
          ppVar3 = polygon_related_8B_ARRAY_0076108c + polygon_counter_draw_units;
          *(short *)(local_8 + 0x42) = (short)polygon_counter_draw_units;
          polygon_counter_draw_units = polygon_counter_draw_units + 1;
          *(undefined1 *)(local_8 + 0x44) = 2;
          ppVar3->x = (char)local_12;
          polygon_related_8B_ARRAY_0076108c[iVar9].y = local_12._1_1_;
          uVar7 = __ftol();
          polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_1 = uVar7;
          uVar7 = __ftol();
          polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_2 = uVar7;
          polygon_related_8B_ARRAY_0076108c[iVar9].type = 1;
          iVar9 = polygon_counter_draw_units;
        }
joined_r0x0046d882:
        polygon_counter_draw_units = iVar9;
        if (local_c != 0) {
          *(short *)(local_c + 0x42) = (short)iVar9;
          polygon_counter_draw_units = polygon_counter_draw_units + 1;
          *(undefined1 *)(local_c + 0x44) = 3;
          polygon_related_8B_ARRAY_0076108c[iVar9].x = (char)local_12;
          polygon_related_8B_ARRAY_0076108c[iVar9].y = local_12._1_1_;
          uVar7 = __ftol();
          polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_1 = uVar7;
          uVar7 = __ftol();
          polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_2 = uVar7;
          polygon_related_8B_ARRAY_0076108c[iVar9].type = 3;
        }
      }
    }
    else {
      if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar8 * 4] & 0xf)) &
          0x3e) != 0) goto LAB_0046d8cd;
      if ((*puVar2 & 1) != 0) {
        uVar10 = 0;
        uVar13 = 0;
        uVar11 = 0;
        if ((uint)ppVar14[1].screen_x < 0x80000001) {
          if ((float)(int)screen_width_2 <= ppVar14[1].screen_x) {
            uVar10 = 4;
          }
        }
        else {
          uVar10 = 2;
        }
        fVar5 = (float)(int)screen_height_2;
        if (fVar5 <= ppVar14[1].screen_y) {
          uVar10 = uVar10 | 0x10;
        }
        if (uVar10 == 0) {
LAB_0046d709:
          bVar6 = true;
        }
        else {
          if ((uint)ppVar14->screen_x < 0x80000001) {
            if ((float)(int)screen_width_2 <= ppVar14->screen_x) {
              uVar13 = 4;
            }
          }
          else {
            uVar13 = 2;
          }
          if (fVar5 <= ppVar14->screen_y) {
            uVar13 = uVar13 | 0x10;
          }
          if ((uVar10 & uVar13) == 0) goto LAB_0046d709;
          if ((uint)ppVar12->screen_x < 0x80000001) {
            if ((float)(int)screen_width_2 <= ppVar12->screen_x) {
              uVar11 = 4;
            }
          }
          else {
            uVar11 = 2;
          }
          if (fVar5 <= ppVar12->screen_y) {
            uVar11 = uVar11 | 0x10;
          }
          bVar6 = false;
          if ((uVar11 & uVar10 & uVar13) == 0) goto LAB_0046d709;
        }
        if (bVar6) {
          local_8 = add_pnts_polygon(ppVar14 + 1,ppVar14,ppVar12,3);
        }
        uVar10 = 0;
        uVar13 = 0;
        uVar11 = 0;
        if ((uint)ppVar12->screen_x < 0x80000001) {
          if ((float)(int)screen_width_2 <= ppVar12->screen_x) {
            uVar10 = 4;
          }
        }
        else {
          uVar10 = 2;
        }
        fVar5 = (float)(int)screen_height_2;
        if (fVar5 <= ppVar12->screen_y) {
          uVar10 = uVar10 | 0x10;
        }
        if (uVar10 == 0) {
LAB_0046d80d:
          bVar6 = true;
        }
        else {
          if ((uint)ppVar12[1].screen_x < 0x80000001) {
            if ((float)(int)screen_width_2 <= ppVar12[1].screen_x) {
              uVar13 = 4;
            }
          }
          else {
            uVar13 = 2;
          }
          if (fVar5 <= ppVar12[1].screen_y) {
            uVar13 = uVar13 | 0x10;
          }
          if ((uVar10 & uVar13) == 0) goto LAB_0046d80d;
          if ((uint)ppVar14[1].screen_x < 0x80000001) {
            if ((float)(int)screen_width_2 <= ppVar14[1].screen_x) {
              uVar11 = 4;
            }
          }
          else {
            uVar11 = 2;
          }
          if (fVar5 <= ppVar14[1].screen_y) {
            uVar11 = uVar11 | 0x10;
          }
          bVar6 = false;
          if ((uVar11 & uVar10 & uVar13) == 0) goto LAB_0046d80d;
        }
        if (bVar6) {
          local_c = add_pnts_polygon(ppVar12,ppVar12 + 1,ppVar14 + 1,1);
        }
        iVar9 = polygon_counter_draw_units;
        if (local_8 != 0) {
          ppVar3 = polygon_related_8B_ARRAY_0076108c + polygon_counter_draw_units;
          *(short *)(local_8 + 0x42) = (short)polygon_counter_draw_units;
          polygon_counter_draw_units = polygon_counter_draw_units + 1;
          *(undefined1 *)(local_8 + 0x44) = 2;
          ppVar3->x = (char)local_12;
          polygon_related_8B_ARRAY_0076108c[iVar9].y = local_12._1_1_;
          uVar7 = __ftol();
          polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_1 = uVar7;
          uVar7 = __ftol();
          polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_2 = uVar7;
          polygon_related_8B_ARRAY_0076108c[iVar9].type = 1;
          iVar9 = polygon_counter_draw_units;
        }
        goto joined_r0x0046d882;
      }
      uVar11 = 0;
      uVar13 = 0;
      uVar10 = 0;
      if ((uint)ppVar14->screen_x < 0x80000001) {
        if ((float)(int)screen_width_2 <= ppVar14->screen_x) {
          uVar11 = 4;
        }
      }
      else {
        uVar11 = 2;
      }
      fVar5 = (float)(int)screen_height_2;
      if (fVar5 <= ppVar14->screen_y) {
        uVar11 = uVar11 | 0x10;
      }
      if (uVar11 == 0) {
LAB_0046d455:
        bVar6 = true;
      }
      else {
        if ((uint)ppVar12->screen_x < 0x80000001) {
          if ((float)(int)screen_width_2 <= ppVar12->screen_x) {
            uVar13 = 4;
          }
        }
        else {
          uVar13 = 2;
        }
        if (fVar5 <= ppVar12->screen_y) {
          uVar13 = uVar13 | 0x10;
        }
        if ((uVar11 & uVar13) == 0) goto LAB_0046d455;
        if ((uint)ppVar12[1].screen_x < 0x80000001) {
          if ((float)(int)screen_width_2 <= ppVar12[1].screen_x) {
            uVar10 = 4;
          }
        }
        else {
          uVar10 = 2;
        }
        if (fVar5 <= ppVar12[1].screen_y) {
          uVar10 = uVar10 | 0x10;
        }
        bVar6 = false;
        if ((uVar10 & uVar11 & uVar13) == 0) goto LAB_0046d455;
      }
      if (bVar6) {
        local_8 = add_pnts_polygon(ppVar14,ppVar12,ppVar12 + 1,0);
      }
      uVar10 = 0;
      uVar13 = 0;
      uVar11 = 0;
      if ((uint)ppVar12[1].screen_x < 0x80000001) {
        if ((float)(int)screen_width_2 <= ppVar12[1].screen_x) {
          uVar10 = 4;
        }
      }
      else {
        uVar10 = 2;
      }
      fVar5 = (float)(int)screen_height_2;
      if (fVar5 <= ppVar12[1].screen_y) {
        uVar10 = uVar10 | 0x10;
      }
      if (uVar10 == 0) {
LAB_0046d559:
        bVar6 = true;
      }
      else {
        if ((uint)ppVar14[1].screen_x < 0x80000001) {
          if ((float)(int)screen_width_2 <= ppVar14[1].screen_x) {
            uVar13 = 4;
          }
        }
        else {
          uVar13 = 2;
        }
        if (fVar5 <= ppVar14[1].screen_y) {
          uVar13 = uVar13 | 0x10;
        }
        if ((uVar10 & uVar13) == 0) goto LAB_0046d559;
        if ((uint)ppVar14->screen_x < 0x80000001) {
          if ((float)(int)screen_width_2 <= ppVar14->screen_x) {
            uVar11 = 4;
          }
        }
        else {
          uVar11 = 2;
        }
        if (fVar5 <= ppVar14->screen_y) {
          uVar11 = uVar11 | 0x10;
        }
        bVar6 = false;
        if ((uVar11 & uVar10 & uVar13) == 0) goto LAB_0046d559;
      }
      if (bVar6) {
        local_c = add_pnts_polygon(ppVar12 + 1,ppVar14 + 1,ppVar14,2);
      }
      iVar9 = polygon_counter_draw_units;
      if (local_8 != 0) {
        ppVar3 = polygon_related_8B_ARRAY_0076108c + polygon_counter_draw_units;
        *(short *)(local_8 + 0x42) = (short)polygon_counter_draw_units;
        polygon_counter_draw_units = polygon_counter_draw_units + 1;
        *(undefined1 *)(local_8 + 0x44) = 0;
        ppVar3->x = (char)local_12;
        polygon_related_8B_ARRAY_0076108c[iVar9].y = local_12._1_1_;
        uVar7 = __ftol();
        polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_1 = uVar7;
        uVar7 = __ftol();
        polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_2 = uVar7;
        polygon_related_8B_ARRAY_0076108c[iVar9].type = 0;
      }
      iVar9 = polygon_counter_draw_units;
      if (local_c != 0) {
        ppVar3 = polygon_related_8B_ARRAY_0076108c + polygon_counter_draw_units;
        *(short *)(local_c + 0x42) = (short)polygon_counter_draw_units;
        polygon_counter_draw_units = polygon_counter_draw_units + 1;
        *(undefined1 *)(local_c + 0x44) = 1;
        ppVar3->x = (char)local_12;
        polygon_related_8B_ARRAY_0076108c[iVar9].y = local_12._1_1_;
        uVar7 = __ftol();
        polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_1 = uVar7;
        uVar7 = __ftol();
        polygon_related_8B_ARRAY_0076108c[iVar9].pnts_related_2 = uVar7;
        polygon_related_8B_ARRAY_0076108c[iVar9].type = 2;
      }
    }
LAB_0046d8cd:
    uVar10 = *puVar2;
    if ((uVar10 & 0x2001c80) != 0) {
      if ((uVar10 & 0x880) == 0) {
        if (((uVar10 & 0x400) != 0) &&
           ((uint)((&game_state.level_data[0].c_2)[uVar8 * 4] & 0xf) - (int)player_tribe_num == 1))
        {
          uVar8 = 0x400;
          goto LAB_0046d92b;
        }
      }
      else {
        iVar9 = FUN_0044b060();
        if (iVar9 == 0) {
          uVar8 = *puVar2 & 0x180;
LAB_0046d92b:
          FUN_00474ba0(puVar2,local_8,local_c,ppVar14,ppVar12,uVar8);
        }
      }
    }
    ppVar14 = ppVar14 + 1;
    ppVar12 = ppVar12 + 1;
    local_12 = CONCAT11(local_12._1_1_,(char)local_12 + '\x02');
    draw_units_land_pos_x._0_1_ = (char)draw_units_land_pos_x + '\x02';
    mesh_generator_curr_x = mesh_generator_curr_x + 0x100;
    mesh_generator_counter = mesh_generator_counter + -1;
  } while( true );
}
