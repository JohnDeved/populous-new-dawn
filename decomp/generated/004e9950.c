/* Ghidra 12.1.3 pseudocode; entry 004e9950; FUN_004e9950.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004e9a8b) */
/* WARNING: Removing unreachable block (ram,0x004e9a95) */

void FUN_004e9950(int param_1)

{
  short *psVar1;
  int iVar2;
  unit_struct *puVar3;
  bool bVar4;
  bool bVar5;
  bool bVar6;
  char cVar7;
  short sVar8;
  ushort uVar9;
  uint uVar10;
  uint uVar11;
  undefined2 local_4;
  short local_2;

  bVar5 = false;
  bVar6 = false;
  if ((*(uint *)(param_1 + 0xc) & 0x800) == 0) {
    if ('c' < *(char *)(param_1 + 0x65)) {
      return;
    }
    *(char *)(param_1 + 0x65) = *(char *)(param_1 + 0x65) + '\x01';
    return;
  }
  if ((*(uint *)(param_1 + 0xc) & 0x20000000) == 0) {
    sVar8 = *(short *)(param_1 + 0x61) + -1;
    *(short *)(param_1 + 0x61) = sVar8;
    if (0 < sVar8) goto LAB_004e9adf;
  }
  else {
    psVar1 = (short *)(param_1 + 0x3d);
    local_4 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                       (char)((ushort)*psVar1 >> 8));
    uVar10 = (local_4 & 0xfe) * 2 | local_4 & 0xfe00;
    iVar2 = uVar10 * 4;
    if (((*(byte *)((int)&game_state.level_data[0].flags + iVar2 + 1) & 2) == 0) ||
       (((*(uint *)(param_1 + 0x10) & 0x10007) != 0 &&
        (cVar7 = FUN_00517f10(param_1,iVar2 + 0x8a03e4), cVar7 == '\0')))) {
      bVar6 = true;
    }
    else if (*(short *)(param_1 + 0x61) < 2) {
      puVar3 = unit_land_array[(ushort)(&game_state.level_data[0].unit_index_2)[uVar10 * 2] & 0x3ff]
      ;
      if (*(short *)(param_1 + 0x61) == 0) {
        FUN_0040a460(puVar3,psVar1,&local_4);
        uVar10 = (int)(short)local_4 - (int)*psVar1 >> 0x1f;
        if ((0x6f < (int)(((int)(short)local_4 - (int)*psVar1 ^ uVar10) - uVar10)) ||
           (uVar10 = (int)local_2 - (int)*(short *)(param_1 + 0x3f), uVar11 = (int)uVar10 >> 0x1f,
           bVar4 = true, 0x6f < (int)((uVar10 ^ uVar11) - uVar11))) {
          bVar4 = false;
        }
        if (bVar4) {
          *(undefined2 *)(param_1 + 0x1c) = 0;
          *(short *)(param_1 + 0x61) = *(short *)(param_1 + 0x61) + 1;
        }
      }
      if (*(short *)(param_1 + 0x61) == 1) {
        FUN_004044b0(puVar3,&local_4);
      }
      uVar10 = (uint)(ushort)(local_4 - *psVar1);
      uVar11 = (uint)(ushort)(local_2 - *(short *)(param_1 + 0x3f));
      if (0x7fff < uVar10) {
        uVar10 = uVar10 - 0x10000;
      }
      if (0x7fff < uVar11) {
        uVar11 = uVar11 - 0x10000;
      }
      uVar9 = calc_angle_quadrant(uVar10,-uVar11);
      *(ushort *)(param_1 + 0x5d) = uVar9 & 0x7ff;
    }
    if (!bVar6) goto LAB_004e9adf;
    *(undefined2 *)(param_1 + 0x61) = 0;
  }
  bVar5 = true;
LAB_004e9adf:
  uVar10 = *(uint *)(param_1 + 0xc);
  if (bVar5) {
    *(undefined1 *)(param_1 + 0x65) = 0;
    *(undefined2 *)(param_1 + 0x61) = 0;
    *(uint *)(param_1 + 0xc) = uVar10 & 0xfffff7ff;
    *(uint *)(param_1 + 0xc) = uVar10 & 0xdffff7ff;
    *(uint *)(param_1 + 0xc) = uVar10 & 0xdffff7ff | 0x1000;
    return;
  }
  if (((uVar10 & 0x80) == 0) && ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0)) {
    *(uint *)(param_1 + 0xc) = uVar10 | 0x80000000;
    return;
  }
  return;
}
