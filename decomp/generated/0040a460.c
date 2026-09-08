/* Ghidra 12.1.3 pseudocode; entry 0040a460; FUN_0040a460.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0040a63f) */
/* WARNING: Removing unreachable block (ram,0x0040a5b0) */
/* WARNING: Removing unreachable block (ram,0x0040a5ba) */
/* WARNING: Removing unreachable block (ram,0x0040a649) */

void FUN_0040a460(int param_1,undefined4 param_2,undefined4 *param_3)

{
  char cVar1;
  bool bVar2;
  ushort uVar3;
  int iVar4;
  int iVar5;
  uint uVar6;
  uint uVar7;
  undefined4 local_18;
  undefined4 local_14;
  undefined4 local_10;
  undefined4 local_c;
  undefined4 local_8;
  undefined4 local_4;

  cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
          [(short)((int)((int)*(short *)(param_1 + 0x26) +
                        ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  local_18 = CONCAT22(*(short *)(param_1 + 0x7c) + (ushort)(byte)shapes_mem[cVar1].y2 * -0x100 +
                      (char)shapes_mem[cVar1].field7_0x7 * 0x40,
                      *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar1].x2 * -0x100 +
                      (char)shapes_mem[cVar1].field6_0x6 * 0x40);
  cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
          [(short)((int)((int)*(short *)(param_1 + 0x26) +
                        ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  local_14 = CONCAT22(*(short *)(param_1 + 0x7c) + (ushort)(byte)shapes_mem[cVar1].y2 * -0x100 +
                      (char)shapes_mem[cVar1].field_0x5 * 0x40,
                      *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar1].x2 * -0x100 +
                      (char)shapes_mem[cVar1].field_0x4 * 0x40);
  iVar4 = calc_squared_distance_toroidal(param_2,&local_18);
  iVar5 = calc_squared_distance_toroidal(param_2,&local_14);
  if (iVar4 < iVar5) {
    local_10 = local_18;
    local_c = local_14;
    iVar5 = iVar4;
  }
  else {
    local_10 = local_14;
    local_c = local_18;
  }
  local_8 = local_10;
  uVar7 = (uint)(ushort)((short)local_c - (short)local_10);
  uVar6 = (uint)(ushort)(local_c._2_2_ - local_10._2_2_);
  if (0x7fff < uVar7) {
    uVar7 = uVar7 - 0x10000;
  }
  if (0x7fff < uVar6) {
    uVar6 = uVar6 - 0x10000;
  }
  uVar3 = calc_angle_quadrant(uVar7,-uVar6);
  do {
    local_4 = local_8;
    move_pos_angle_length(&local_8,uVar3 & 0x7ff,0x40);
    iVar4 = calc_squared_distance_toroidal(param_2,&local_8);
    bVar2 = iVar4 < iVar5;
    iVar5 = iVar4;
  } while (bVar2);
  uVar7 = (uint)(ushort)((short)local_18 - (short)local_14);
  uVar6 = (uint)(ushort)(local_18._2_2_ - local_14._2_2_);
  if (0x7fff < uVar7) {
    uVar7 = uVar7 - 0x10000;
  }
  if (0x7fff < uVar6) {
    uVar6 = uVar6 - 0x10000;
  }
  uVar3 = calc_angle_quadrant(uVar7,-uVar6);
  move_pos_angle_length(&local_4,uVar3 & 0x7ff,0x20);
  *param_3 = local_4;
  return;
}
