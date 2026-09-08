/* Ghidra 12.1.3 pseudocode; entry 0046f9e0; add_object_to_rendering_queue_type_0x11.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_object_to_rendering_queue_type_0x11
               (undefined4 param_1,int param_2,undefined2 param_3,undefined2 param_4)

{
  union_polygon *puVar1;
  undefined2 uVar2;
  uint uVar3;
  int iVar4;
  uint uVar5;
  uint uVar6;
  int local_20;
  int local_1c;
  int local_18;
  uint local_10;
  undefined4 local_8;

  puVar1 = empty_polygon;
  empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_v;
  uVar5 = (uint)*(ushort *)(param_2 + 0x3d) - (uint)(ushort)tribe_ptr->x;
  uVar3 = uVar5;
  if ((int)uVar5 < 0) {
    uVar3 = -uVar5;
  }
  uVar6 = uVar5;
  if (((uVar3 & 0x8000) != 0) && (uVar6 = uVar3 - 0x10000, (int)uVar5 < 1)) {
    uVar6 = 0x10000 - uVar3;
  }
  local_20 = (int)uVar6 >> 1;
  uVar5 = (uint)*(ushort *)(param_2 + 0x3f) - (uint)(ushort)tribe_ptr->y;
  uVar3 = uVar5;
  if ((int)uVar5 < 0) {
    uVar3 = -uVar5;
  }
  uVar6 = uVar5;
  if (((uVar3 & 0x8000) != 0) && (uVar6 = uVar3 - 0x10000, (int)uVar5 < 1)) {
    uVar6 = 0x10000 - uVar3;
  }
  local_18 = (int)uVar6 >> 1;
  local_8 = 0;
  local_1c = (int)*(short *)(param_2 + 0x41);
  coord_global_convert(&local_20);
  if (local_10 < 0x80000001) {
    iVar4 = local_18 + 0x6f80;
    if (iVar4 < 0x40) {
      iVar4 = 0;
    }
    else {
      iVar4 = (int)(iVar4 + (iVar4 >> 0x1f & 0xfU)) >> 4;
      if (0xe00 < iVar4) {
        iVar4 = 0xe00;
      }
    }
    (puVar1->field0).next = polygons_to_draw[iVar4];
    polygons_to_draw[iVar4] = (polygon_drawn *)puVar1;
    (puVar1->field0).type = 0x12;
    uVar2 = __ftol();
    *(undefined2 *)&(puVar1->field0).point_1_u = uVar2;
    uVar2 = __ftol();
    *(undefined2 *)((int)&(puVar1->field0).point_1_u + 2) = uVar2;
    (puVar1->field0).point_1_x = param_2;
    *(undefined2 *)&(puVar1->field0).point_1_y = param_3;
    *(undefined2 *)((int)&(puVar1->field0).point_1_y + 2) = param_4;
  }
  return;
}
