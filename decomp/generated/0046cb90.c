/* Ghidra 12.1.3 pseudocode; entry 0046cb90; main_landscape_mesh_generation.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void main_landscape_mesh_generation(void)

{
  short sVar1;
  byte bVar2;
  short sVar3;
  ushort uVar4;
  uint uVar6;
  int iVar7;
  pnts_related_struct *ppVar8;
  uint *puVar9;
  byte local_4;
  byte bStack_3;
  int iVar5;

  sVar3 = mesh_render_bounds_ptr->start;
  if (sVar3 != 0) {
    sVar1 = mesh_render_bounds_ptr[1].start;
    if (sVar1 != 0) {
      if (sVar1 <= sVar3) {
        sVar3 = sVar1;
      }
      iVar7 = (int)sVar3;
      sVar3 = mesh_render_bounds_ptr->end;
      if (mesh_render_bounds_ptr->end <= mesh_render_bounds_ptr[1].end) {
        sVar3 = mesh_render_bounds_ptr[1].end;
      }
      iVar5 = (int)sVar3;
      goto LAB_0046cbf4;
    }
    if (sVar3 != 0) {
      iVar7 = (int)sVar3;
      iVar5 = (int)mesh_render_bounds_ptr->end;
      goto LAB_0046cbf4;
    }
  }
  iVar7 = (int)mesh_render_bounds_ptr[1].start;
  iVar5 = (int)mesh_render_bounds_ptr[1].end;
LAB_0046cbf4:
  mesh_generator_counter = iVar5 - iVar7;
  if (mesh_generator_counter != 0) {
    ppVar8 = landscape_mesh_1 + iVar7;
    bVar2 = (char)iVar7 * '\x02' + (char)mesh_generator_base_y;
    mesh_generator_curr_x = iVar7 * 0x100 + mesh_generator_base_x;
    mesh_generator_counter = mesh_generator_counter + 1;
    draw_units_land_pos_x = CONCAT11(draw_units_land_pos_x._1_1_,bVar2);
    if ((int)((uint)bVar2 + mesh_generator_counter * 2) < 0x100) {
      puVar9 = &game_state.level_data[0].flags +
               ((draw_units_land_pos_x & 0xfe) * 2 | draw_units_land_pos_x & 0xfe00);
      iVar7 = mesh_generator_curr_y;
      for (; mesh_generator_curr_y = iVar7, 0 < mesh_generator_counter;
          mesh_generator_counter = mesh_generator_counter + -1) {
        ppVar8->x = mesh_generator_curr_x;
        ppVar8->z = iVar7;
        *(undefined4 *)&ppVar8->field_0x18 = 0;
        iVar7 = FUN_0046cfc0(puVar9);
        if (iVar7 == 0) {
          uVar4 = (ushort)((int)(puVar9 + -0x2280f9) >> 4);
          sVar3 = ((uVar4 & 0xff80) * 2 | uVar4 & 0x7f) * 2;
          bStack_3 = (byte)((ushort)sVar3 >> 8);
          local_4 = (byte)sVar3;
          iVar7 = ((uint)bStack_3 * 0x100 + (uint)local_4) * 8;
          iVar7 = (uint)*(byte *)(((game_state.offset_counter_2 & 0xff) * 0x101 + iVar7 & 0xffff) +
                                 watdisp_mem) +
                  (uint)*(byte *)(((game_state.offset_counter_2 & 0xff) * -0x101 + iVar7 + 0x4c &
                                  0xffff) + watdisp_mem);
          ppVar8->y = iVar7 >> 3;
          iVar7 = (iVar7 >> 4) + 0x10;
          ppVar8->maybe_color = iVar7;
          if (iVar7 == 0) {
            ppVar8->maybe_color = 1;
          }
          if (0x20 < ppVar8->maybe_color) {
            ppVar8->maybe_color = 0x20;
          }
          *(uint *)&ppVar8->field_0x18 = *(uint *)&ppVar8->field_0x18 | 0x80;
        }
        else {
          ppVar8->y = (int)(short)puVar9[1];
          ppVar8->maybe_color = (ushort)((ushort)puVar9[2] >> 10) + 0x20;
        }
        if (((*puVar9 & 0x200) != 0) && ((*puVar9 & 0x100000) == 0)) {
          *(uint *)&ppVar8->field_0x18 = *(uint *)&ppVar8->field_0x18 | 0x40;
        }
        puVar9 = puVar9 + 4;
        coord_pnts_global_convert(ppVar8);
        mesh_generator_curr_x = mesh_generator_curr_x + 0x100;
        ppVar8 = ppVar8 + 1;
        iVar7 = mesh_generator_curr_y;
      }
    }
    else if (0 < mesh_generator_counter) {
      do {
        iVar7 = mesh_generator_curr_y;
        uVar6 = (draw_units_land_pos_x & 0xfe) * 2 | draw_units_land_pos_x & 0xfe00;
        ppVar8->x = mesh_generator_curr_x;
        ppVar8->z = iVar7;
        *(undefined4 *)&ppVar8->field_0x18 = 0;
        bVar2 = (&game_state.level_data[0].c_3)[uVar6 * 4] & 0xf;
        uVar4 = (ushort)((int)(uVar6 * 4) >> 4);
        if ((*(byte *)(landscape_height_array + bVar2) & 1) == 0) {
          if ((*(byte *)(landscape_height_array + bVar2) & 0x3c) == 0) {
            bVar2 = 0;
          }
          else {
            bVar2 = landscape_height_array[bVar2].field_0xd & 0x80;
          }
        }
        else {
          bVar2 = 1;
        }
        if (bVar2 == 0) {
          sVar3 = ((uVar4 & 0xff80) * 2 | uVar4 & 0x7f) * 2;
          bStack_3 = (byte)((ushort)sVar3 >> 8);
          local_4 = (byte)sVar3;
          iVar7 = ((uint)bStack_3 * 0x100 + (uint)local_4) * 8;
          iVar7 = (uint)*(byte *)(((game_state.offset_counter_2 & 0xff) * 0x101 + iVar7 & 0xffff) +
                                 watdisp_mem) +
                  (uint)*(byte *)(((game_state.offset_counter_2 & 0xff) * -0x101 + iVar7 + 0x4c &
                                  0xffff) + watdisp_mem);
          ppVar8->y = iVar7 >> 3;
          iVar7 = (iVar7 >> 4) + 0x10;
          ppVar8->maybe_color = iVar7;
          if (iVar7 == 0) {
            ppVar8->maybe_color = 1;
          }
          if (0x20 < ppVar8->maybe_color) {
            ppVar8->maybe_color = 0x20;
          }
          *(uint *)&ppVar8->field_0x18 = *(uint *)&ppVar8->field_0x18 | 0x80;
        }
        else {
          ppVar8->y = (int)(short)(&game_state.level_data[0].height)[uVar6 * 2];
          ppVar8->maybe_color =
               ((ushort)(&game_state.level_data[0].unit_index_2)[uVar6 * 2] >> 10) + 0x20;
        }
        uVar6 = (&game_state.level_data[0].flags)[uVar6];
        if (((uVar6 & 0x200) != 0) && ((uVar6 & 0x100000) == 0)) {
          *(uint *)&ppVar8->field_0x18 = *(uint *)&ppVar8->field_0x18 | 0x40;
        }
        coord_pnts_global_convert(ppVar8);
        ppVar8 = ppVar8 + 1;
        draw_units_land_pos_x._0_1_ = (char)draw_units_land_pos_x + '\x02';
        mesh_generator_curr_x = mesh_generator_curr_x + 0x100;
        mesh_generator_counter = mesh_generator_counter + -1;
      } while (0 < mesh_generator_counter);
      return;
    }
  }
  return;
}
