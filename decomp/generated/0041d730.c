/* Ghidra 12.1.3 pseudocode; entry 0041d730; draw_persons_and_buildings_globe.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void draw_persons_and_buildings_globe(void)

{
  char cVar1;
  unit_struct *puVar2;
  bool bVar3;
  undefined4 uVar4;
  int iVar5;
  ushort *puVar6;
  uint uVar7;
  uint uVar8;
  int iVar9;
  unit_struct *puVar10;
  int iVar11;
  unit_struct *puVar12;
  int iVar13;
  undefined2 local_1e;
  undefined4 local_1c;
  int local_18;
  undefined4 local_14;
  undefined4 local_10;
  int local_c;
  int local_8;
  undefined4 local_4;

  iVar11 = globe_tex_struct.sqrt_rel >> 9;
  tex_struct_get_x_y(&local_18,&local_4);
  local_c = iVar11 * 2 + 1;
  cVar1 = (char)iVar11;
  iVar11 = 0x89d1c8;
  local_1c = 0;
  local_14._0_2_ = CONCAT11(local_4._1_1_ + cVar1 * -2,(char)((uint)local_18 >> 8) + cVar1 * -2);
  do {
    if (*(char *)(iVar11 + 0xc20) != '\0') {
      iVar5 = *(int *)(iVar11 + 0x885);
      if ((int)player_tribe_num == local_1c) {
        for (; iVar5 != 0; iVar5 = *(int *)(iVar5 + 8)) {
          if (*(char *)(iVar5 + 0x2b) == '\x04') {
            if (*(char *)(iVar5 + 0x2f) != player_tribe_num) {
              iVar9 = 0;
              if (unit_type_array_building[4].field31_0x20 != 0) {
                puVar6 = (ushort *)(iVar5 + 0x86);
                do {
                  puVar10 = (unit_struct *)0x0;
                  if (((*puVar6 != 0) &&
                      (puVar12 = unit_land_array[*puVar6], (*(byte *)&puVar12->flags_2 & 1) == 0))
                     && (puVar12->unit_class != '\0')) {
                    puVar10 = puVar12;
                  }
                  if ((puVar10 != (unit_struct *)0x0) && (puVar10->unit_type != '\x05')) {
                    if (((byte)level_flags & 4) != 0) {
                      uVar7 = local_10 >> 0x10;
                      local_10._2_2_ = (undefined2)uVar7;
                      local_10._0_2_ =
                           CONCAT11((char)((ushort)*(undefined2 *)(iVar5 + 0x3f) >> 8),
                                    (char)((ushort)*(undefined2 *)(iVar5 + 0x3d) >> 8));
                      if ((*(byte *)(&game_state.level_data[0].flags +
                                    (((ushort)local_10 & 0xfe) * 2 | (ushort)local_10 & 0xfe00)) & 8
                          ) == 0) break;
                    }
                    bVar3 = true;
                    goto LAB_0041d84a;
                  }
                  puVar6 = puVar6 + 1;
                  iVar9 = iVar9 + 1;
                } while (iVar9 < (int)(uint)unit_type_array_building[4].field31_0x20);
              }
              goto LAB_0041d848;
            }
            bVar3 = true;
          }
          else {
LAB_0041d848:
            bVar3 = false;
          }
LAB_0041d84a:
          if (bVar3) {
            add_tribe_unit_to_globe(iVar11,iVar5);
          }
        }
      }
      else {
        for (; iVar5 != 0; iVar5 = *(int *)(iVar5 + 8)) {
          if (*(char *)(iVar5 + 0x2b) == '\x04') {
            add_tribe_unit_to_globe_2(iVar11,iVar5);
          }
        }
      }
    }
    iVar11 = iVar11 + 0xc65;
    local_1c = local_1c + 1;
    if (3 < (int)local_1c) {
      iVar11 = (int)player_tribe_num;
      puVar10 = game_state.tribes_array[iVar11].shaman;
      uVar7 = 0;
      if (puVar10 != (unit_struct *)0x0) {
        if (DAT_0089c6e7 == '\r') {
          uVar7 = (uint)DAT_0089ce81;
        }
        else if (DAT_005cae78 != 0) {
          uVar7 = (uint)DAT_005cae78;
        }
        if ((uVar7 != 0) && (((&DAT_005a80eb)[uVar7 * 0x3e] & 0x80) == 0)) {
          uVar4 = FUN_004c2e30(puVar10,CONCAT31((int3)(uVar7 * 0x3e >> 8),puVar10->tribe_index),
                               uVar7);
          cVar1 = game_state.tribes_array[iVar11].tribe_num;
          add_circle(uVar4,0x20,&puVar10->pos,CONCAT31(cVar1 >> 7,(&DAT_0059bc19)[cVar1 * 4]),1);
        }
      }
      local_1c._2_2_ = (undefined2)(local_1c >> 0x10);
      local_1c = CONCAT22(local_1c._2_2_,(undefined2)local_14);
      iVar11 = local_18;
      local_18 = local_c;
      for (local_4 = local_c; local_c = local_18, local_4 != 0; local_4 = local_4 + -1) {
        for (; local_18 != 0; local_18 = local_18 + -1) {
          uVar7 = (local_1c & 0xfe) * 2 | local_1c & 0xfe00;
          iVar11 = uVar7 * 4 + 0x8a03e4;
          iVar5 = tex_struct_is_point_visible((local_1c & 0xff) << 8,(uint)local_1c._1_1_ << 8);
          if ((iVar5 != 0) &&
             (add_tribe_unit_rect(iVar11,local_1c),
             (&game_state.level_data[0].unit_index)[uVar7 * 2] != 0)) {
            add_unit_polygons_globe(iVar11);
          }
          local_1c = CONCAT31(local_1c._1_3_,(char)local_1c + '\x02');
        }
        local_1c = CONCAT31(CONCAT21(local_1c._2_2_,local_1c._1_1_ + 2),(undefined1)local_14);
        iVar11 = 0;
        local_18 = local_c;
      }
      local_4 = 0;
      for (puVar10 = allocated_units; local_18 = iVar11, puVar10 != (unit_struct *)0x0;
          puVar10 = puVar10->next_unit_1) {
        bVar3 = true;
        if (((*(undefined1 *)((int)&puVar10->flags_4 + 3) & 0x40) != 0) &&
           ((*(undefined1 *)((int)&puVar10->flags_2 + 2) & 2) == 0)) {
          bVar3 = false;
        }
        if ((bVar3) &&
           ((((byte)level_flags & 4) == 0 ||
            (local_1e = CONCAT11((char)((ushort)(puVar10->pos).y >> 8),
                                 (char)((ushort)(puVar10->pos).x >> 8)),
            (*(byte *)(&game_state.level_data[0].flags + ((local_1e & 0xfe) * 2 | local_1e & 0xfe00)
                      ) & 8) != 0)))) {
          bVar3 = false;
          iVar5 = (int)(short)(puVar10->pos).y;
          iVar11 = (int)(short)(puVar10->pos).x;
          tex_struct_convert_to_tex_coords(iVar11,iVar5,&local_18,&local_8);
          cVar1 = puVar10->unit_class;
          if (cVar1 == '\x02') {
            if ((((puVar10->object).flags & 1) != 0) && (puVar10->state == '\x02')) {
              iVar11 = 0;
              bVar3 = true;
              if (puVar10->tribe_index == player_tribe_num) {
                iVar11 = (int)(char)puVar10->hut_people_inside;
              }
              switch(puVar10->unit_type) {
              case 1:
                local_1c = iVar11 + 0x86;
                break;
              case 2:
                local_1c = iVar11 + 0x8a;
                break;
              case 3:
                local_1c = iVar11 + 0x8f;
                break;
              case 4:
                local_1c = 0x78;
                if ((puVar10->hut_people_inside != '\0') &&
                   (unit_type_array_building[4].field31_0x20 != 0)) {
                  puVar6 = &puVar10->loc_3_x;
                  uVar7 = (uint)unit_type_array_building[4].field31_0x20;
                  do {
                    puVar12 = (unit_struct *)0x0;
                    if (((*puVar6 != 0) &&
                        (puVar2 = unit_land_array[*puVar6], (puVar2->flags_2 & 1) == 0)) &&
                       (puVar2->unit_class != '\0')) {
                      puVar12 = puVar2;
                    }
                    if (puVar12 != (unit_struct *)0x0) {
                      switch(puVar12->unit_type) {
                      case 2:
                        local_1c = 0xa3;
                        break;
                      case 3:
                        local_1c = 0x74;
                        break;
                      case 4:
                        local_1c = 0x76;
                        break;
                      case 5:
                        local_1c = 0x77;
                        break;
                      case 6:
                        local_1c = 0x75;
                        break;
                      case 7:
                        local_1c = 0x85;
                      }
                    }
                    puVar6 = puVar6 + 1;
                    uVar7 = uVar7 - 1;
                  } while (uVar7 != 0);
                }
                break;
              case 5:
                local_1c = 0xa6;
                break;
              case 6:
                local_1c = 0xa7;
                break;
              case 7:
                local_1c = 0xa4;
                break;
              case 8:
                local_1c = 0xa5;
                break;
              default:
                local_1c = 0x434;
                break;
              case 0xd:
                local_1c = 0xa8;
                break;
              case 0xf:
                local_1c = 0xa9;
                break;
              case 0x11:
                local_1c = 0x43b;
                break;
              case 0x12:
                local_1c = 0x79;
                break;
              case 0x13:
                local_1c = 0x95;
              }
            }
          }
          else if (cVar1 == '\x04') {
            iVar11 = tex_struct_is_point_visible(iVar11,iVar5);
            if (iVar11 != 0) {
              bVar3 = true;
              local_1c = (-(uint)((*(ushort *)
                                    &unit_type_array_vehicle[(byte)puVar10->unit_type].field_0x15 &
                                  1) == 0) & 0xfffffffc) + 0x81 + (int)(char)puVar10->tribe_index;
            }
          }
          else if (((cVar1 == '\x05') && (puVar10->unit_type == '\t')) &&
                  (iVar11 = tex_struct_is_point_visible(iVar11,iVar5), iVar11 != 0)) {
            bVar3 = true;
            switch(puVar10->shrine_type) {
            case 1:
            case 5:
              local_1c = 0x7b;
              break;
            case 2:
              local_1c = 0x7c;
              break;
            default:
              bVar3 = false;
              break;
            case 4:
              local_1c = 0x7a;
            }
          }
          if (bVar3) {
            iVar11 = hfx_0_addr + local_1c * 8;
            local_10 = (uint)*(ushort *)(iVar11 + 4);
            local_14 = (uint)*(ushort *)(iVar11 + 6);
            iVar11 = (int)local_10 >> 1;
            iVar13 = (int)local_14 >> 1;
            local_18 = local_18 - iVar11;
            local_8 = local_8 - iVar13;
            local_c = (int)screen_height;
            iVar9 = (int)screen_width;
            iVar5 = FUN_0044bb70();
            local_c = local_c >> 1;
            iVar5 = iVar5 + (iVar9 - iVar5 >> 1);
            iVar9 = iVar5 - local_18;
            if (iVar9 < 0) {
              iVar9 = local_18 - iVar5;
            }
            iVar5 = local_c - local_8;
            if (iVar5 < 0) {
              iVar5 = local_8 - local_c;
            }
            iVar5 = iVar9 * iVar9 + iVar5 * iVar5;
            iVar9 = ((int)screen_height << 2) / 10;
            iVar9 = iVar9 * iVar9;
            if (iVar9 >> 1 < iVar5) {
              if (iVar9 < iVar5) {
                iVar5 = iVar9;
              }
              iVar5 = ((iVar9 - iVar5) * 0x8000) / (iVar9 >> 1) + 0x8000;
              uVar8 = (int)(iVar5 * local_10) >> 0x10;
              uVar7 = (int)(iVar5 * local_14) >> 0x10;
              if ((int)uVar8 < 1) {
                uVar8 = 1;
              }
              if ((int)uVar7 < 1) {
                uVar7 = 1;
              }
              if ((int)local_10 < (int)uVar8) {
                uVar8 = local_10;
              }
              if ((int)local_14 < (int)uVar7) {
                uVar7 = local_14;
              }
              local_18 = (local_18 + iVar11) - ((int)uVar8 >> 1);
              local_8 = (local_8 + iVar13) - ((int)uVar7 >> 1);
              add_polygon_rect_sprite_2(local_18,local_8,hfx_0_addr + local_1c * 8,uVar8,uVar7);
            }
            else {
              add_polygon_rect_sprite(local_18,local_8,hfx_0_addr + local_1c * 8);
            }
          }
        }
        iVar11 = local_18;
      }
      return;
    }
  } while( true );
}
