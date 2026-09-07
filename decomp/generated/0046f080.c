/* Ghidra 12.1.3 pseudocode; entry 0046f080; add_object_to_rendering_queue_type_1_10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_object_to_rendering_queue_type_1_10(undefined4 param_1,int param_2)

{
  union_polygon *puVar1;
  undefined2 uVar2;
  undefined2 uVar3;
  uint uVar4;
  short sVar5;
  int iVar6;
  ushort uVar7;
  uint uVar8;
  uint uVar9;
  ushort uVar10;
  int local_20;
  int local_1c;
  int local_18;
  uint local_10;
  undefined4 local_8;

  puVar1 = empty_polygon;
  uVar7 = *(short *)(param_2 + 0x3d) - *(short *)(param_2 + 0x43);
  uVar10 = *(short *)(param_2 + 0x3f) - *(short *)(param_2 + 0x45);
  sVar5 = *(short *)(param_2 + 0x41) - *(short *)(param_2 + 0x47);
  if (((((*(byte *)(param_2 + 0x15) & 1) != 0) && (((byte)land_flags_1 & 2) == 0)) &&
      (iVar6 = sprite_animation_counter - *(int *)(param_2 + 0x18), iVar6 != 0)) &&
     (maybe_framerate != 0)) {
    iVar6 = DAT_005ca84c * iVar6;
    uVar7 = uVar7 + (short)((*(short *)(param_2 + 0x43) * iVar6) / maybe_framerate);
    uVar10 = uVar10 + (short)((*(short *)(param_2 + 0x45) * iVar6) / maybe_framerate);
    sVar5 = sVar5 + (short)((*(short *)(param_2 + 0x47) * iVar6) / maybe_framerate);
  }
  empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_u;
  uVar8 = (uint)uVar7 - (uint)(ushort)tribe_ptr->x;
  uVar4 = uVar8;
  if ((int)uVar8 < 0) {
    uVar4 = -uVar8;
  }
  uVar9 = uVar8;
  if (((uVar4 & 0x8000) != 0) && (uVar9 = uVar4 - 0x10000, (int)uVar8 < 1)) {
    uVar9 = 0x10000 - uVar4;
  }
  local_20 = (int)uVar9 >> 1;
  uVar8 = (uint)uVar10 - (uint)(ushort)tribe_ptr->y;
  uVar4 = uVar8;
  if ((int)uVar8 < 0) {
    uVar4 = -uVar8;
  }
  uVar9 = uVar8;
  if (((uVar4 & 0x8000) != 0) && (uVar9 = uVar4 - 0x10000, (int)uVar8 < 1)) {
    uVar9 = 0x10000 - uVar4;
  }
  local_8 = 0;
  local_18 = (int)uVar9 >> 1;
  local_1c = (int)*(short *)(param_2 + 0x1c) + (int)sVar5;
  coord_global_convert(&local_20);
  if (local_10 < 0x80000001) {
    if ((*(byte *)(param_2 + 0x15) & 4) == 0) {
      iVar6 = -300;
    }
    else {
      iVar6 = (int)*(char *)(param_2 + 0x3b) << 4;
    }
    iVar6 = local_18 + 0x7000 + iVar6;
    if (iVar6 < 0x40) {
      iVar6 = 0;
    }
    else {
      iVar6 = (int)(iVar6 + (iVar6 >> 0x1f & 0xfU)) >> 4;
      if (0xe00 < iVar6) {
        iVar6 = 0xe00;
      }
    }
    (puVar1->field0).next = polygons_to_draw[iVar6];
    polygons_to_draw[iVar6] = (polygon_drawn *)puVar1;
    if ((*(byte *)(param_2 + 0x35) & 0x40) == 0) {
      (puVar1->field0).type = next_polygon_type;
    }
    else {
      (puVar1->field0).type = 0x1a;
    }
    uVar2 = __ftol();
    *(undefined2 *)&(puVar1->field0).point_1_y = uVar2;
    uVar2 = __ftol();
    *(undefined2 *)((int)&(puVar1->field0).point_1_y + 2) = uVar2;
    (puVar1->field0).point_1_x = param_2;
    uVar2 = __ftol();
    uVar3 = __ftol();
    if ((*(char *)(param_2 + 0x2a) == '\x06') && (*(char *)(param_2 + 0x2b) == '\x02')) {
      *(undefined2 *)(param_2 + 0x68) = uVar3;
      *(undefined2 *)(param_2 + 0x6a) = uVar2;
    }
  }
  return;
}
