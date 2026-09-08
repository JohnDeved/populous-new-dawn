/* Ghidra 12.1.3 pseudocode; entry 0046f850; add_object_to_rendering_queue_different.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_object_to_rendering_queue_different(int param_1,char param_2)

{
  union_polygon *puVar1;
  short sVar2;
  undefined2 uVar3;
  uint uVar4;
  ushort uVar5;
  ushort uVar6;
  int iVar7;
  uint uVar8;
  uint uVar9;
  int local_20;
  int local_1c;
  int local_18;
  uint local_10;
  undefined4 local_8;

  puVar1 = empty_polygon;
  uVar5 = *(short *)(param_1 + 0x3d) - *(short *)(param_1 + 0x43);
  uVar6 = *(short *)(param_1 + 0x3f) - *(short *)(param_1 + 0x45);
  if (((((*(byte *)(param_1 + 0x15) & 1) != 0) && (((byte)land_flags_1 & 2) == 0)) &&
      (iVar7 = sprite_animation_counter - *(int *)(param_1 + 0x18), iVar7 != 0)) &&
     (maybe_framerate != 0)) {
    iVar7 = iVar7 * DAT_005ca84c;
    uVar5 = uVar5 + (short)((*(short *)(param_1 + 0x43) * iVar7) / maybe_framerate);
    uVar6 = uVar6 + (short)((*(short *)(param_1 + 0x45) * iVar7) / maybe_framerate);
  }
  empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_y;
  uVar8 = (uint)uVar5 - (uint)(ushort)tribe_ptr->x;
  uVar4 = uVar8;
  if ((int)uVar8 < 0) {
    uVar4 = -uVar8;
  }
  uVar9 = uVar8;
  if (((uVar4 & 0x8000) != 0) && (uVar9 = uVar4 - 0x10000, (int)uVar8 < 1)) {
    uVar9 = 0x10000 - uVar4;
  }
  local_20 = (int)uVar9 >> 1;
  uVar8 = (uint)uVar6 - (uint)(ushort)tribe_ptr->y;
  uVar4 = uVar8;
  if ((int)uVar8 < 0) {
    uVar4 = -uVar8;
  }
  uVar9 = uVar8;
  if (((uVar4 & 0x8000) != 0) && (uVar9 = uVar4 - 0x10000, (int)uVar8 < 1)) {
    uVar9 = 0x10000 - uVar4;
  }
  local_18 = (int)uVar9 >> 1;
  local_8 = 0;
  sVar2 = calc_point_height(uVar5,uVar6);
  local_1c = (int)sVar2;
  coord_global_convert(&local_20);
  if (local_10 < 0x80000001) {
    iVar7 = local_18 + 0x6f40;
    if (iVar7 < 0x40) {
      iVar7 = 0;
    }
    else {
      iVar7 = (int)(iVar7 + (iVar7 >> 0x1f & 0xfU)) >> 4;
      if (0xe00 < iVar7) {
        iVar7 = 0xe00;
      }
    }
    (puVar1->field0).next = polygons_to_draw[iVar7];
    polygons_to_draw[iVar7] = (polygon_drawn *)puVar1;
    (puVar1->field0).type = param_2 + '\x0f';
    uVar3 = __ftol();
    *(undefined2 *)&(puVar1->field0).point_1_x = uVar3;
    uVar3 = __ftol();
    *(undefined2 *)((int)&(puVar1->field0).point_1_x + 2) = uVar3;
  }
  return;
}
