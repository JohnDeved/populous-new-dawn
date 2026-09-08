/* Ghidra 12.1.3 pseudocode; entry 00471a80; add_polygon_to_draw_3v.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_polygon_to_draw_3v
               (int param_1,int param_2,int param_3,uint param_4,char param_5,char param_6,
               char param_7,char param_8,undefined2 param_9)

{
  int *piVar1;
  union_polygon *puVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;

  puVar2 = empty_polygon;
  if (polypool_mem_end_2 <= empty_polygon) {
    return;
  }
  empty_polygon = empty_polygon + 1;
  iVar6 = (int)param_6;
  iVar7 = (int)param_5;
  piVar1 = (int *)(param_2 + param_7 * 4);
  iVar5 = *(int *)(*(int *)(param_2 + iVar7 * 4) + 8);
  iVar4 = (*(int *)(*piVar1 + 8) + *(int *)(*(int *)(param_2 + iVar6 * 4) + 8) + iVar5 + 0x15000) *
          0x55;
  iVar3 = iVar4 >> 8;
  if (0x3f < iVar3) {
    iVar4 = (int)(iVar3 + (iVar4 >> 0x1f & 0xfU)) >> 4;
    if (param_3 == 0) {
      if (0xe00 < iVar4) {
        iVar4 = 0xe00;
      }
      goto LAB_00471b2b;
    }
    iVar4 = iVar4 + param_3;
    if (0xe00 < iVar4) {
      iVar4 = 0xe00;
      goto LAB_00471b2b;
    }
    if (-1 < iVar4) goto LAB_00471b2b;
  }
  iVar4 = 0;
LAB_00471b2b:
  if (((-0xd00 < iVar5) && ((param_4 & 0xff000000) == 0)) &&
     (iVar5 = (-0xd00 - iVar5) * 0x20,
     param_4 = param_4 + ((int)(iVar5 + (iVar5 >> 0x1f & 0x1fffU)) >> 0xd), (int)param_4 < 1)) {
    param_4 = 1;
  }
  (puVar2->field0).next = polygons_to_draw[iVar4];
  polygons_to_draw[iVar4] = (polygon_drawn *)puVar2;
  (puVar2->field0).type = 6;
  (puVar2->field0).unknown_1 = 0;
  (puVar2->field0).tex_size_type = *(undefined1 *)(param_1 + 7);
  (puVar2->field0).tex_index = (char)*(undefined2 *)(param_1 + 2) + param_8 + '\x01';
  (puVar2->field0).tex_index_2 = param_9;
  (puVar2->field0).point_1_x = *(undefined4 *)(*(int *)(param_2 + iVar7 * 4) + 0xc);
  (puVar2->field0).point_1_y = *(undefined4 *)(*(int *)(param_2 + iVar7 * 4) + 0x10);
  (puVar2->field0).point_1_u = *(undefined4 *)(param_1 + 8 + iVar7 * 8);
  (puVar2->field0).point_1_v = *(undefined4 *)(param_1 + iVar7 * 8 + 0xc);
  (puVar2->field0).point_1_color = param_4;
  (puVar2->field0).point_2_x = *(undefined4 *)(*(int *)(param_2 + iVar6 * 4) + 0xc);
  iVar5 = param_1 + iVar6 * 8;
  (puVar2->field0).point_2_y = *(undefined4 *)(*(int *)(param_2 + iVar6 * 4) + 0x10);
  (puVar2->field0).point_2_u = *(undefined4 *)(iVar5 + 8);
  (puVar2->field0).point_2_v = *(undefined4 *)(iVar5 + 0xc);
  (puVar2->field0).point_2_color = param_4;
  (puVar2->field0).point_3_x = *(undefined4 *)(*piVar1 + 0xc);
  (puVar2->field0).point_3_y = *(undefined4 *)(*piVar1 + 0x10);
  param_1 = param_1 + param_7 * 8;
  (puVar2->field0).point_3_u = *(undefined4 *)(param_1 + 8);
  (puVar2->field0).point_3_v = *(undefined4 *)(param_1 + 0xc);
  (puVar2->field0).point_3_color = param_4;
  return;
}
