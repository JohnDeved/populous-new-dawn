/* Ghidra 12.1.3 pseudocode; entry 00409710; FUN_00409710.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004097cb) */
/* WARNING: Removing unreachable block (ram,0x004097d5) */

void FUN_00409710(int param_1,int param_2,ushort *param_3)

{
  byte bVar1;
  byte bVar2;
  char cVar3;
  char cVar4;
  short sVar5;
  short sVar6;
  short sVar7;
  ushort uVar8;
  uint uVar9;
  uint uVar10;
  uint uVar11;
  int iVar12;
  uint uVar13;
  shape_entry *psVar14;
  uint uVar15;
  uint uVar16;
  ushort local_2c;
  ushort local_2a;
  ushort local_28;
  ushort uStack_26;
  undefined2 local_24;
  ushort local_20;
  ushort uStack_1e;
  undefined2 local_1c;
  uint local_18;
  uint local_14;
  uint local_e;
  uint local_8;
  int local_4;

  sVar5 = *(short *)(param_1 + 0x7a);
  psVar14 = shapes_mem +
            (char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                  [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  bVar1 = psVar14->x2;
  bVar2 = psVar14->y2;
  cVar3 = psVar14->field_0x5;
  sVar6 = *(short *)(param_1 + 0x7c);
  local_e = CONCAT22(local_e._2_2_,*(short *)(param_1 + 0x7c) + (ushort)bVar2 * -0x100);
  cVar4 = psVar14->field_0x4;
  sVar7 = *(short *)(param_1 + 0x7a);
  FUN_004044b0(param_1,&local_2c);
  uVar15 = (uint)(ushort)((((short)cVar4 + (ushort)bVar1 * -4) * 0x40 + sVar7) - local_2c);
  uVar9 = (uint)(ushort)((((short)cVar3 + (ushort)bVar2 * -4) * 0x40 + sVar6) - local_2a);
  if (0x7fff < uVar15) {
    uVar15 = uVar15 - 0x10000;
  }
  if (0x7fff < uVar9) {
    uVar9 = uVar9 - 0x10000;
  }
  uVar8 = calc_angle_quadrant(uVar15,-uVar9);
  uVar9 = (uVar8 & 0x7ff) + 0x100 >> 9 & 3;
  local_28 = local_2c;
  uStack_26 = local_2a;
  uVar15 = (uVar9 - 1 & 3) << 9;
  if (param_2 == 0) goto LAB_00409ad5;
  switch(uVar9) {
  case 0:
    uStack_26 = (local_2a & 0xfe00) + 0x1c0;
    local_28 = ((short)((int)((int)(short)local_2c + ((int)(short)local_2c >> 0x1f & 0x3fU)) >> 6) -
                1U | 1) << 6;
    break;
  case 1:
    local_28 = (local_2c & 0xfe00) + 0x1c0;
    goto LAB_004098d4;
  case 2:
    uStack_26 = (local_2a & 0xfe00) + 0x40;
    local_28 = ((short)((int)((int)(short)local_2c + ((int)(short)local_2c >> 0x1f & 0x3fU)) >> 6) -
                1U | 1) << 6;
    break;
  case 3:
    local_28 = (local_2c & 0xfe00) + 0x40;
LAB_004098d4:
    uStack_26 = ((short)((int)((int)(short)local_2a + ((int)(short)local_2a >> 0x1f & 0x3fU)) >> 6)
                 - 1U | 1) << 6;
  }
  local_24 = 0;
  if (0 < param_2) {
    local_4 = param_2;
    local_14 = (uint)(ushort)(sVar5 + (ushort)bVar1 * -0x100);
    local_8 = local_e & 0xffff;
    do {
      uVar16 = uVar15 + 0x200 & 0x7ff;
      local_20 = local_28;
      uStack_1e = uStack_26;
      local_1c = local_24;
      move_pos_angle_length(&local_20,uVar16,0x80);
      uVar10 = local_14 - local_20;
      uVar9 = uVar10;
      if ((int)uVar10 < 0) {
        uVar9 = -uVar10;
      }
      uVar11 = uVar10;
      if (((uVar9 & 0x8000) != 0) && (uVar11 = uVar9 - 0x10000, (int)uVar10 < 1)) {
        uVar11 = 0x10000 - uVar9;
      }
      uVar10 = local_8 - uStack_1e;
      uVar9 = uVar10;
      if ((int)uVar10 < 0) {
        uVar9 = -uVar10;
      }
      uVar13 = uVar10;
      if (((uVar9 & 0x8000) != 0) && (uVar13 = uVar9 - 0x10000, (int)uVar10 < 1)) {
        uVar13 = 0x10000 - uVar9;
      }
      if ((int)uVar11 < 0) {
        uVar11 = -uVar11;
      }
      if ((int)uVar13 < 0) {
        uVar13 = -uVar13;
      }
      local_18 = (int)(uVar11 + ((int)uVar11 >> 0x1f & 0x1ffU)) >> 9;
      if ((psVar14->ptr
           [local_18 +
            (uint)(byte)psVar14->x1 * ((int)(uVar13 + ((int)uVar13 >> 0x1f & 0x1ffU)) >> 9)] & 1) ==
          0) {
        uVar15 = uVar16;
      }
      local_20 = local_28;
      uStack_1e = uStack_26;
      local_1c = local_24;
      move_pos_angle_length(&local_20,uVar15,0x80);
      uVar10 = local_14 - local_20;
      local_18 = local_18 & 0xffffff00;
      uVar9 = uVar10;
      if ((int)uVar10 < 0) {
        uVar9 = -uVar10;
      }
      uVar16 = uVar10;
      if (((uVar9 & 0x8000) != 0) && (uVar16 = uVar9 - 0x10000, (int)uVar10 < 1)) {
        uVar16 = 0x10000 - uVar9;
      }
      iVar12 = calc_distance_1d_wraparound(local_e,CONCAT22(local_1c,uStack_1e));
      if ((int)uVar16 < 0) {
        uVar16 = -uVar16;
      }
      if (iVar12 < 0) {
        iVar12 = -iVar12;
      }
      if ((psVar14->ptr
           [((int)(uVar16 + ((int)uVar16 >> 0x1f & 0x1ffU)) >> 9) +
            (uint)(byte)psVar14->x1 * ((int)(iVar12 + (iVar12 >> 0x1f & 0x1ffU)) >> 9)] & 4) != 0) {
        local_18 = CONCAT31(local_18._1_3_,1);
      }
      if ((char)local_18 == '\0') {
        uVar15 = uVar15 - 0x200 & 0x7ff;
      }
      move_pos_angle_length(&local_28,uVar15,0x80);
      local_4 = local_4 + -1;
    } while (local_4 != 0);
  }
LAB_00409ad5:
  *param_3 = local_28;
  param_3[1] = uStack_26;
  return;
}
