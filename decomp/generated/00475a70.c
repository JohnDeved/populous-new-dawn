/* Ghidra 12.1.3 pseudocode; entry 00475a70; render_halo_shaman.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void render_halo_shaman(void)

{
  bool bVar1;
  union_polygon *puVar2;
  short sVar3;
  undefined2 uVar4;
  int iVar5;
  undefined3 uVar6;
  uint uVar7;
  uint uVar8;
  ushort uVar9;
  uint uVar10;
  uint uVar11;
  unit_struct *puVar12;
  ushort local_44;
  ushort uStack_42;
  undefined2 local_40;
  undefined4 local_3c;
  int local_38;
  int local_34;
  int local_30;
  int local_2c;
  uint local_1c;
  undefined4 local_14;
  undefined2 local_10;
  uint local_c;
  uint local_8;
  int local_4;

  iVar5 = (int)player_tribe_num;
  uVar7 = 0;
  if ((game_state.tribes_array[iVar5].shaman == (unit_struct *)0x0) &&
     ((game_state._4_4_ & 0x20) == 0)) {
    return;
  }
  if (DAT_0089c6e7 == '\r') {
    uVar7 = (uint)DAT_0089ce81;
  }
  else if (DAT_005cae78 != 0) {
    uVar7 = (uint)DAT_005cae78;
  }
  if (((((game_state._4_4_ & 0x20) == 0) || ((minimap_state_and_cache._2_1_ & 1) == 0)) ||
      ((DAT_0089c6e7 != '\0' && (DAT_0089c6e7 != '\r')))) ||
     (bVar1 = true, (DAT_0098e908._1_1_ & 8) == 0)) {
    bVar1 = false;
  }
  if (!bVar1) {
    if (uVar7 == 0) {
      return;
    }
    if (((&DAT_005a80eb)[uVar7 * 0x3e] & 0x80) != 0) {
      return;
    }
  }
  if (DAT_0059d9d4 != '\0') {
    DAT_0059d9d4 = '\0';
  }
  if ((game_state._4_4_ & 0x20) == 0) {
    puVar12 = game_state.tribes_array[iVar5].shaman;
    uVar6 = (undefined3)(uVar7 >> 8);
    local_14._0_2_ = (puVar12->pos).x;
    local_14._2_2_ = (puVar12->pos).y;
    local_10 = (puVar12->pos).z;
  }
  else {
    local_10 = *(undefined2 *)&game_state.tribes_array[iVar5].field_0x915;
    local_14 = *(undefined4 *)&game_state.tribes_array[iVar5].field_0x911;
    local_3c = DAT_005aa5e0;
    if (bVar1) goto LAB_00475b95;
    uVar6 = (undefined3)((uint)local_14 >> 8);
    puVar12 = (unit_struct *)0x0;
  }
  local_3c = FUN_004c2e30(puVar12,CONCAT31(uVar6,player_tribe_num),uVar7);
LAB_00475b95:
  local_38 = 0;
  render_counter_halo = render_counter_halo + 8;
  local_c = (uint)tribe_ptr->x;
  local_4 = sprite_animation_counter;
  local_8 = (uint)tribe_ptr->y;
  uVar9 = render_counter_halo;
  do {
    puVar2 = empty_polygon;
    if (polypool_mem_end_2 <= empty_polygon) {
      return;
    }
    empty_polygon = (union_polygon *)((int)&(empty_polygon->field0).point_1_y + 2);
    local_44 = (ushort)local_14;
    uStack_42 = (ushort)((uint)local_14 >> 0x10);
    local_40 = local_10;
    move_pos_angle_length(&local_44,uVar9 & 0x7ff,local_3c);
    uVar10 = (uint)local_44 - (local_c & 0xffff);
    uVar7 = uVar10;
    if ((int)uVar10 < 0) {
      uVar7 = -uVar10;
    }
    uVar11 = uVar10;
    if (((uVar7 & 0x8000) != 0) && (uVar11 = uVar7 - 0x10000, (int)uVar10 < 1)) {
      uVar11 = 0x10000 - uVar7;
    }
    uVar10 = (uint)uStack_42 - (local_8 & 0xffff);
    uVar7 = uVar10;
    if ((int)uVar10 < 0) {
      uVar7 = -uVar10;
    }
    uVar8 = uVar10;
    if (((uVar7 & 0x8000) != 0) && (uVar8 = uVar7 - 0x10000, (int)uVar10 < 1)) {
      uVar8 = 0x10000 - uVar7;
    }
    local_34 = (int)uVar11 >> 1;
    local_2c = (int)uVar8 >> 1;
    sVar3 = calc_point_height(CONCAT22(uStack_42,local_44),CONCAT22(local_40,uStack_42));
    local_30 = (int)sVar3;
    local_1c = 0;
    coord_global_convert(&local_34);
    if ((local_1c & 0x1e) == 0) {
      iVar5 = local_2c + 0x6ed4;
      if (iVar5 < 0x40) {
        iVar5 = 0;
      }
      else {
        iVar5 = (int)(iVar5 + (iVar5 >> 0x1f & 0xfU)) >> 4;
        if (0xe00 < iVar5) {
          iVar5 = 0xe00;
        }
      }
      (puVar2->field0).next = polygons_to_draw[iVar5];
      polygons_to_draw[iVar5] = (polygon_drawn *)puVar2;
      (puVar2->field0).type = 0x18;
      uVar4 = __ftol();
      *(undefined2 *)&(puVar2->field0).point_1_x = uVar4;
      uVar4 = __ftol();
      *(undefined2 *)((int)&(puVar2->field0).point_1_x + 2) = uVar4;
      *(short *)&(puVar2->field0).point_1_y = (short)((local_38 + local_4) % 0xc) + 0x5ba;
      puVar2 = empty_polygon;
      if (empty_polygon < polypool_mem_end_2) {
        empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_y;
        (puVar2->field0).next = polygons_to_draw[iVar5];
        polygons_to_draw[iVar5] = (polygon_drawn *)puVar2;
        (puVar2->field0).type = 0x19;
        local_34 = (int)uVar11 >> 1;
        local_2c = (int)uVar8 >> 1;
        sVar3 = calc_point_height(CONCAT22(uStack_42,local_44),CONCAT22(local_40,uStack_42));
        local_30 = (int)sVar3;
        local_1c = 0;
        coord_global_convert(&local_34);
        uVar4 = __ftol();
        *(undefined2 *)&(puVar2->field0).point_1_x = uVar4;
        uVar4 = __ftol();
        *(undefined2 *)((int)&(puVar2->field0).point_1_x + 2) = uVar4;
      }
    }
    uVar9 = (uVar9 & 0x7ff) + 0x18;
    local_38 = local_38 + 1;
  } while (local_38 < 0x55);
  return;
}
