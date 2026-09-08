/* Ghidra 12.1.3 pseudocode; entry 00474080; add_object_to_rendering_queue_type_0xd.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_object_to_rendering_queue_type_0xd(undefined4 param_1,int param_2)

{
  union_polygon *puVar1;
  undefined2 uVar2;
  uint uVar3;
  int iVar4;
  uint uVar5;
  uint uVar6;
  int *piVar7;
  int *piVar8;
  int local_40 [4];
  uint local_30;
  undefined4 local_28;
  int local_20 [8];

  puVar1 = empty_polygon;
  empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_u;
  uVar5 = (uint)*(ushort *)(param_2 + 0x3d) - (uint)(ushort)tribe_ptr->x;
  uVar3 = uVar5;
  if ((int)uVar5 < 0) {
    uVar3 = -uVar5;
  }
  uVar6 = uVar5;
  if (((uVar3 & 0x8000) != 0) && (uVar6 = uVar3 - 0x10000, (int)uVar5 < 1)) {
    uVar6 = 0x10000 - uVar3;
  }
  local_20[0] = (int)uVar6 >> 1;
  uVar5 = (uint)*(ushort *)(param_2 + 0x3f) - (uint)(ushort)tribe_ptr->y;
  uVar3 = uVar5;
  if ((int)uVar5 < 0) {
    uVar3 = -uVar5;
  }
  uVar6 = uVar5;
  if (((uVar3 & 0x8000) != 0) && (uVar6 = uVar3 - 0x10000, (int)uVar5 < 1)) {
    uVar6 = 0x10000 - uVar3;
  }
  local_20[2] = (int)uVar6 >> 1;
  local_20[1] = (int)*(short *)(param_2 + 0x41);
  piVar7 = local_20;
  piVar8 = local_40;
  for (iVar4 = 8; iVar4 != 0; iVar4 = iVar4 + -1) {
    *piVar8 = *piVar7;
    piVar7 = piVar7 + 1;
    piVar8 = piVar8 + 1;
  }
  local_28 = 0;
  coord_global_convert(local_40);
  if (local_30 < 0x80000001) {
    local_40[2] = local_40[2] + 0x6f80;
    if (local_40[2] < 0x40) {
      iVar4 = 0;
    }
    else {
      iVar4 = (int)(local_40[2] + (local_40[2] >> 0x1f & 0xfU)) >> 4;
      if (0xe00 < iVar4) {
        iVar4 = 0xe00;
      }
    }
    (puVar1->field0).next = polygons_to_draw[iVar4];
    polygons_to_draw[iVar4] = (polygon_drawn *)puVar1;
    (puVar1->field0).type = 0x11;
    uVar2 = __ftol();
    *(undefined2 *)&(puVar1->field0).point_1_y = uVar2;
    uVar2 = __ftol();
    *(undefined2 *)((int)&(puVar1->field0).point_1_y + 2) = uVar2;
    (puVar1->field0).point_1_x = param_2;
  }
  return;
}
