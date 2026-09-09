/* Ghidra 12.1.3 pseudocode; entry 0046e930; add_pnts_polygon.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


union_polygon * add_pnts_polygon(int param_1,int param_2,int param_3,undefined1 param_4)

{
  longlong lVar1;
  union_polygon *puVar2;
  int iVar3;
  uint uVar4;
  uint uVar5;
  uint uVar6;
  uint uVar7;
  union_polygon *local_40;

  puVar2 = empty_polygon;
  if (empty_polygon < polypool_mem_end_2) {
    local_40 = empty_polygon;
    empty_polygon = empty_polygon + 1;
    iVar3 = (*(int *)(param_2 + 8) + *(int *)(param_3 + 8) + *(int *)(param_1 + 8) + 0x15000) * 0x55
            >> 8;
    if ((((*(byte *)(param_1 + 0x18) & 0x40) != 0) || ((*(byte *)(param_2 + 0x18) & 0x40) != 0)) ||
       ((*(byte *)(param_3 + 0x18) & 0x40) != 0)) {
      iVar3 = iVar3 + 0x100;
    }
    if (iVar3 < 0x40) {
      uVar4 = 0;
    }
    else {
      uVar4 = (int)(iVar3 + (iVar3 >> 0x1f & 0xfU)) >> 4;
      if (0xe00 < (int)uVar4) {
        uVar4 = 0xe00;
      }
    }
    uVar6 = *(int *)(param_1 + 8) - z_pos_camera;
    if (0 < (int)uVar6) {
      lVar1 = (longlong)
              (int)((uint)((longlong)(int)uVar6 * (longlong)(int)uVar6) >> 0x10 |
                   (int)((ulonglong)((longlong)(int)uVar6 * (longlong)(int)uVar6) >> 0x20) << 0x10)
              * (longlong)(int)((uint)maybe_fog << 8);
      uVar6 = (uint)lVar1 >> 0x10 | (int)((ulonglong)lVar1 >> 0x20) << 0x10;
    }
    if ((int)uVar6 < 0) {
      uVar6 = 0;
    }
    if (0x20 < (int)uVar6) {
      uVar6 = 0x20;
    }
    uVar7 = *(int *)(param_2 + 8) - z_pos_camera;
    if (0 < (int)uVar7) {
      lVar1 = (longlong)
              (int)((uint)((longlong)(int)uVar7 * (longlong)(int)uVar7) >> 0x10 |
                   (int)((ulonglong)((longlong)(int)uVar7 * (longlong)(int)uVar7) >> 0x20) << 0x10)
              * (longlong)(int)((uint)maybe_fog << 8);
      uVar7 = (uint)lVar1 >> 0x10 | (int)((ulonglong)lVar1 >> 0x20) << 0x10;
    }
    if ((int)uVar7 < 0) {
      uVar7 = 0;
    }
    if (0x20 < (int)uVar7) {
      uVar7 = 0x20;
    }
    uVar5 = *(int *)(param_3 + 8) - z_pos_camera;
    if (0 < (int)uVar5) {
      lVar1 = (longlong)
              (int)((uint)((longlong)(int)uVar5 * (longlong)(int)uVar5) >> 0x10 |
                   (int)((ulonglong)((longlong)(int)uVar5 * (longlong)(int)uVar5) >> 0x20) << 0x10)
              * (longlong)(int)((uint)maybe_fog << 8);
      uVar5 = (uint)lVar1 >> 0x10 | (int)((ulonglong)lVar1 >> 0x20) << 0x10;
    }
    if ((int)uVar5 < 0) {
      uVar5 = 0;
    }
    if (0x20 < (int)uVar5) {
      uVar5 = 0x20;
    }
    if (max_point_depth < uVar4) {
      max_point_depth = uVar4;
    }
    if (uVar4 < min_point_depth) {
      min_point_depth = uVar4;
    }
    (puVar2->field0).next = polygons_to_draw[uVar4];
    polygons_to_draw[uVar4] = (polygon_drawn *)puVar2;
    (puVar2->field0).type = 0;
    (puVar2->field0).unknown_1 = 0;
    (puVar2->field0).tex_size_type = param_4;
    (puVar2->field0).point_1_x = *(undefined4 *)(param_1 + 0xc);
    (puVar2->field0).point_1_y = *(undefined4 *)(param_1 + 0x10);
    (puVar2->field0).point_2_x = *(undefined4 *)(param_2 + 0xc);
    (puVar2->field0).point_2_y = *(undefined4 *)(param_2 + 0x10);
    (puVar2->field0).point_3_x = *(undefined4 *)(param_3 + 0xc);
    (puVar2->field0).point_3_y = *(undefined4 *)(param_3 + 0x10);
    (puVar2->field0).point_1_color = *(int *)(param_1 + 0x14) - uVar6;
    (puVar2->field0).point_2_color = *(int *)(param_2 + 0x14) - uVar7;
    (puVar2->field0).point_3_color = *(int *)(param_3 + 0x14) - uVar5;
  }
  else {
    local_40 = (union_polygon *)0x0;
  }
  return local_40;
}
