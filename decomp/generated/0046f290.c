/* Ghidra 12.1.3 pseudocode; entry 0046f290; add_object_to_rendering_queue_type_0x13.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


union_polygon * add_object_to_rendering_queue_type_0x13(undefined4 param_1,int param_2)

{
  char cVar1;
  char cVar2;
  short sVar3;
  undefined4 uVar4;
  uint uVar5;
  union_polygon *puVar6;
  short sVar7;
  undefined2 uVar8;
  int iVar9;
  uint uVar10;
  union_polygon *puVar11;
  uint uVar12;
  uint uVar13;
  uint uVar14;
  ushort uVar15;
  ushort uVar16;
  int iVar17;
  short *psVar18;
  int *piVar19;
  uint uVar20;
  byte local_78;
  byte bStack_77;
  short sStack_76;
  undefined2 local_70;
  undefined4 local_68;
  ushort local_64 [2];
  int local_60;
  ushort local_5c;
  int local_58;
  ushort local_54;
  int local_50;
  ushort local_4c;
  int local_48;
  ushort local_44;
  int local_40;
  ushort local_3c;
  int local_38;
  ushort local_34;
  int local_30;
  ushort local_2c;
  int local_28;
  ushort local_24;
  int local_20;
  int local_1c;
  int local_18;
  undefined4 local_8;

  uVar20 = (uint)*(ushort *)(param_2 + 0x24);
  iVar17 = 0;
  sVar3 = tribe_ptr->y;
  uVar5._0_2_ = tribe_ptr->x;
  uVar5._2_2_ = tribe_ptr->y;
  uVar10._0_2_ = tribe_ptr->x;
  uVar10._2_2_ = tribe_ptr->y;
  local_24 = CONCAT11((char)((ushort)*(undefined2 *)(param_2 + 0x3f) >> 8),
                      (char)((ushort)*(undefined2 *)(param_2 + 0x3d) >> 8)) & 0xfefe;
  local_78 = (byte)local_24;
  bStack_77 = (byte)(local_24 >> 8);
  cVar1 = bStack_77 + '\x02';
  local_64[0] = CONCAT11(cVar1,local_78 + -2);
  local_5c = CONCAT11(cVar1,local_78);
  cVar2 = local_78 + '\x02';
  local_54 = CONCAT11(cVar1,cVar2);
  local_4c = CONCAT11(bStack_77,cVar2);
  cVar1 = bStack_77 + -2;
  local_44 = CONCAT11(cVar1,cVar2);
  local_3c = CONCAT11(cVar1,local_78);
  local_34 = CONCAT11(cVar1,local_78 + -2);
  local_2c = CONCAT11(bStack_77,local_78 + -2);
  iVar9 = ((local_64[0] & 0xfe) * 2 | local_64[0] & 0xfe00) * 4 + 0x8a03e4;
  local_68._0_1_ = (undefined1)iVar9;
  local_68._1_1_ = (undefined1)((uint)iVar9 >> 8);
  local_68._2_1_ = (undefined1)((uint)iVar9 >> 0x10);
  local_68._3_1_ = (undefined1)((uint)iVar9 >> 0x18);
  local_60 = ((local_5c & 0xfe) * 2 | local_5c & 0xfe00) * 4 + 0x8a03e4;
  local_58 = ((local_54 & 0xfe) * 2 | local_54 & 0xfe00) * 4 + 0x8a03e4;
  local_50 = ((local_4c & 0xfe) * 2 | local_4c & 0xfe00) * 4 + 0x8a03e4;
  local_48 = ((local_44 & 0xfe) * 2 | local_44 & 0xfe00) * 4 + 0x8a03e4;
  local_40 = ((local_3c & 0xfe) * 2 | local_3c & 0xfe00) * 4 + 0x8a03e4;
  local_38 = ((local_34 & 0xfe) * 2 | local_34 & 0xfe00) * 4 + 0x8a03e4;
  local_30 = ((local_2c & 0xfe) * 2 | local_2c & 0xfe00) * 4 + 0x8a03e4;
  piVar19 = &local_68;
  local_28 = ((local_24 & 0xfe) * 2 | local_24 & 0xfe00) * 4 + 0x8a03e4;
  do {
    puVar6 = empty_polygon;
    if (((*(byte *)(*piVar19 + 10) < 0x80) &&
        ((*(byte *)(landscape_height_array + (*(byte *)(*piVar19 + 0xc) & 0xf)) & 2) == 0)) &&
       (empty_polygon < polypool_mem_end_2)) {
      empty_polygon = (union_polygon *)((int)&(empty_polygon->field0).point_1_y + 2);
      local_78 = (byte)(short)piVar19[1];
      bStack_77 = (byte)((ushort)(short)piVar19[1] >> 8);
      uVar16 = ((local_78 & 0xfe) + 1) * 0x100;
      uVar15 = ((bStack_77 & 0xfe) + 1) * 0x100;
      sVar7 = calc_point_height(uVar16,uVar15);
      uVar13 = (uint)uVar16 - (uVar10 & 0xffff);
      uVar12 = uVar13;
      if ((int)uVar13 < 0) {
        uVar12 = -uVar13;
      }
      uVar14 = uVar13;
      if (((uVar12 & 0x8000) != 0) && (uVar14 = uVar12 - 0x10000, (int)uVar13 < 1)) {
        uVar14 = 0x10000 - uVar12;
      }
      local_20 = (int)uVar14 >> 1;
      uVar13 = (uint)uVar15 - (CONCAT12(local_78,sVar3) & 0xffff);
      uVar12 = uVar13;
      if ((int)uVar13 < 0) {
        uVar12 = -uVar13;
      }
      uVar14 = uVar13;
      if (((uVar12 & 0x8000) != 0) && (uVar14 = uVar12 - 0x10000, (int)uVar13 < 1)) {
        uVar14 = 0x10000 - uVar12;
      }
      local_18 = (int)uVar14 >> 1;
      local_8 = 0;
      local_1c = sVar7 + -0x20;
      coord_global_convert(&local_20);
      iVar9 = local_18 + 0x6ed4;
      if (iVar9 < 0x40) {
        iVar9 = 0;
      }
      else {
        iVar9 = (int)(iVar9 + (iVar9 >> 0x1f & 0xfU)) >> 4;
        if (0xe00 < iVar9) {
          iVar9 = 0xe00;
        }
      }
      (puVar6->field0).next = polygons_to_draw[iVar9];
      polygons_to_draw[iVar9] = (polygon_drawn *)puVar6;
      (puVar6->field0).type = 0x1e;
      uVar8 = __ftol();
      *(undefined2 *)((int)&(puVar6->field0).point_1_x + 2) = uVar8;
      uVar8 = __ftol();
      *(undefined2 *)&(puVar6->field0).point_1_y = uVar8;
      *(char *)&(puVar6->field0).point_1_x =
           (char)((ulonglong)(uint)(sprite_animation_counter + iVar17) % 10);
    }
    piVar19 = piVar19 + 2;
    iVar17 = iVar17 + 1;
  } while (piVar19 < &local_20);
  iVar9 = 5;
  cVar1 = *(char *)(param_2 + 0x72);
  sStack_76 = (short)(cVar1 >> 7);
  psVar18 = (short *)(&DAT_0059d980 + cVar1 * 0x14);
  do {
    puVar6 = empty_polygon;
    uVar4 = *(undefined4 *)(param_2 + 0x3d);
    local_64[0] = *(undefined2 *)(param_2 + 0x41);
    local_68._0_1_ = (undefined1)uVar4;
    local_68._1_1_ = (undefined1)((uint)uVar4 >> 8);
    uVar16 = (short)uVar4 + *psVar18;
    uVar15 = (short)((uint)uVar4 >> 0x10) + psVar18[1];
    local_68._3_1_ = (undefined1)(uVar15 >> 8);
    local_70 = CONCAT11(local_68._3_1_,(char)(uVar16 >> 8));
    uVar10 = (local_70 & 0xfe) * 2 | local_70 & 0xfe00;
    iVar17 = uVar10 * 4;
    puVar11 = (union_polygon *)(&game_state.level_data[0].flags + uVar10);
    if ((((byte)(&game_state.level_data[0].cliff_index)[iVar17] < 0x80) &&
        (puVar11 = (union_polygon *)(uint)((&game_state.level_data[0].c_3)[iVar17] & 0xf),
        (*(byte *)(landscape_height_array + (int)puVar11) & 2) == 0)) &&
       (puVar11 = empty_polygon, empty_polygon < polypool_mem_end_2)) {
      empty_polygon = (union_polygon *)((int)&(empty_polygon->field0).point_1_y + 2);
      local_68._2_2_ = uVar15;
      sVar7 = calc_point_height(uVar16,CONCAT22(local_64[0],uVar15));
      uVar12 = (uint)uVar16 - (uVar5 & 0xffff);
      uVar10 = uVar12;
      if ((int)uVar12 < 0) {
        uVar10 = -uVar12;
      }
      uVar13 = uVar12;
      if (((uVar10 & 0x8000) != 0) && (uVar13 = uVar10 - 0x10000, (int)uVar12 < 1)) {
        uVar13 = 0x10000 - uVar10;
      }
      local_20 = (int)uVar13 >> 1;
      uVar12 = (uint)local_68._2_2_ - (CONCAT12(cVar1,sVar3) & 0xffff);
      uVar10 = uVar12;
      if ((int)uVar12 < 0) {
        uVar10 = -uVar12;
      }
      uVar13 = uVar12;
      if (((uVar10 & 0x8000) != 0) && (uVar13 = uVar10 - 0x10000, (int)uVar12 < 1)) {
        uVar13 = 0x10000 - uVar10;
      }
      local_18 = (int)uVar13 >> 1;
      local_8 = 0;
      local_1c = (int)sVar7;
      coord_global_convert(&local_20);
      iVar17 = local_18 + 0x6ed4;
      if (iVar17 < 0x40) {
        iVar17 = 0;
      }
      else {
        iVar17 = (int)(iVar17 + (iVar17 >> 0x1f & 0xfU)) >> 4;
        if (0xe00 < iVar17) {
          iVar17 = 0xe00;
        }
      }
      (puVar6->field0).next = polygons_to_draw[iVar17];
      polygons_to_draw[iVar17] = (polygon_drawn *)puVar6;
      (puVar6->field0).type = 0x1f;
      uVar8 = __ftol();
      *(undefined2 *)((int)&(puVar6->field0).point_1_x + 2) = uVar8;
      uVar8 = __ftol();
      *(undefined2 *)&(puVar6->field0).point_1_y = uVar8;
      puVar11 = (union_polygon *)((int)uVar20 / 0xc);
      *(char *)&(puVar6->field0).point_1_x = (char)((int)uVar20 % 0xc);
    }
    uVar20 = uVar20 + CONCAT22(sStack_76,(short)cVar1);
    psVar18 = psVar18 + 2;
    iVar9 = iVar9 + -1;
  } while (iVar9 != 0);
  return puVar11;
}
