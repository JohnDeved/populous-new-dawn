/* Ghidra 12.1.3 pseudocode; entry 00475550; FUN_00475550.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00475550(undefined4 param_1,int param_2)

{
  int iVar1;
  int iVar2;
  union_polygon *puVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  pnts_related_struct *ppVar7;
  int iVar8;
  int iVar9;
  int local_20;

  puVar3 = empty_polygon;
  iVar8 = -1;
  iVar5 = -1;
  iVar4 = -1;
  iVar6 = 0xfffffff;
  iVar9 = 0xfffffff;
  if (empty_polygon < polypool_mem_end_2) {
    ppVar7 = temp_pnts_related_array;
    local_20 = (int)*(short *)(param_2 + 4);
    if (0 < local_20) {
      do {
        iVar1 = (int)ROUND(ppVar7->screen_x);
        iVar2 = (int)ROUND(ppVar7->screen_y);
        if (iVar1 < iVar6) {
          iVar6 = iVar1;
        }
        if (iVar2 < iVar9) {
          iVar9 = iVar2;
        }
        if (iVar8 < iVar1) {
          iVar8 = iVar1;
        }
        if (iVar5 < iVar2) {
          iVar5 = iVar2;
        }
        if (iVar4 < (int)ROUND((float)ppVar7->z)) {
          iVar4 = (int)ROUND((float)ppVar7->z);
        }
        ppVar7 = ppVar7 + 1;
        local_20 = local_20 + -1;
      } while (local_20 != 0);
    }
    iVar4 = iVar4 + 0x7000;
    empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_v;
    if (iVar4 < 0x40) {
      iVar4 = 0;
    }
    else {
      iVar4 = (int)(iVar4 + (iVar4 >> 0x1f & 0xfU)) >> 4;
      if (0xe00 < iVar4) {
        iVar4 = 0xe00;
      }
    }
    (puVar3->field0).next = polygons_to_draw[iVar4];
    polygons_to_draw[iVar4] = (polygon_drawn *)puVar3;
    (puVar3->field0).type = 0x15;
    *(short *)&(puVar3->field0).point_1_y = (short)iVar6;
    *(short *)((int)&(puVar3->field0).point_1_y + 2) = (short)iVar9;
    *(short *)&(puVar3->field0).point_1_u = (short)iVar8;
    *(short *)((int)&(puVar3->field0).point_1_u + 2) = (short)iVar5;
    (puVar3->field0).point_1_x = param_1;
  }
  return;
}
