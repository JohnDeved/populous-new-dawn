/* Ghidra 12.1.3 pseudocode; entry 004baf00; FUN_004baf00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004bb0ad) */
/* WARNING: Removing unreachable block (ram,0x004bb0b7) */

void FUN_004baf00(int param_1)

{
  ushort uVar1;
  short sVar2;
  short sVar3;
  bool bVar4;
  undefined2 uVar5;
  uint uVar6;
  int iVar7;
  uint uVar8;
  uint uVar9;
  uint uVar10;
  int local_10;
  short local_8;
  short local_6;
  undefined2 local_4;

  bVar4 = false;
  uVar1 = *(ushort *)(param_1 + 0x35);
  if (*(char *)(param_1 + 0x2d) == '\0') {
    *(undefined1 *)(param_1 + 0x2d) = 1;
    *(undefined4 *)(param_1 + 0x3d) = *(undefined4 *)(param_1 + 0x70);
    *(undefined2 *)(param_1 + 0x41) = *(undefined2 *)(param_1 + 0x74);
    *(short *)(param_1 + 0x6c) = *(short *)(param_1 + 0x5f) / *(short *)(param_1 + 0x6a);
  }
  local_10 = 0;
  if (0 < *(short *)(param_1 + 0x6a)) {
    do {
      if (bVar4) goto LAB_004bb140;
      *(short *)(param_1 + 0x9a) = *(short *)(param_1 + 0x9a) + 1;
      uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar10 = uVar6 >> 0xd;
      uVar6 = uVar10 | uVar6 * 0x80000;
      local_8 = (*(short *)(param_1 + 0x3d) - ((ushort)uVar10 & 0xf)) + 8;
      local_4 = *(undefined2 *)(param_1 + 0x41);
      uVar9 = uVar6 * 0x24a1 + 0x24df;
      uVar10 = uVar9 >> 0xd;
      game_state.pseudo_random_val = uVar10 | uVar9 * 0x80000;
      local_6 = (*(short *)(param_1 + 0x3f) - ((ushort)uVar10 & 0xf)) + 8;
      iVar7 = alloc_unit(7,4,CONCAT31((int3)(uVar6 * 9 >> 8),*(undefined1 *)(param_1 + 0x2f)),
                         &local_8);
      if ((iVar7 != 0) &&
         (*(ushort *)(iVar7 + 0x6c) = (ushort)*(byte *)(param_1 + 0x7f), (uVar1 & 0x40) != 0)) {
        *(byte *)(iVar7 + 0x35) = *(byte *)(iVar7 + 0x35) | 0x40;
      }
      uVar6 = (int)*(short *)(param_1 + 0x76) - (int)*(short *)(param_1 + 0x3d);
      uVar10 = (int)uVar6 >> 0x1f;
      if ((((int)((uVar6 ^ uVar10) - uVar10) < 0x6c) &&
          (uVar6 = (int)*(short *)(param_1 + 0x7a) - (int)*(short *)(param_1 + 0x41),
          uVar10 = (int)uVar6 >> 0x1f, (int)((uVar6 ^ uVar10) - uVar10) < 0x6c)) &&
         (uVar6 = (int)*(short *)(param_1 + 0x78) - (int)*(short *)(param_1 + 0x3f),
         uVar10 = (int)uVar6 >> 0x1f, (int)((uVar6 ^ uVar10) - uVar10) < 0x6c)) {
        bVar4 = true;
      }
      else {
        sVar2 = *(short *)(param_1 + 0x7a);
        sVar3 = *(short *)(param_1 + 0x41);
        uVar6 = (uint)(ushort)(*(short *)(param_1 + 0x76) - *(short *)(param_1 + 0x3d));
        uVar10 = (uint)(ushort)(*(short *)(param_1 + 0x78) - *(short *)(param_1 + 0x3f));
        if (0x7fff < uVar6) {
          uVar6 = uVar6 - 0x10000;
        }
        if (0x7fff < uVar10) {
          uVar10 = uVar10 - 0x10000;
        }
        uVar9 = uVar6;
        if ((int)uVar6 < 0) {
          uVar9 = -uVar6;
        }
        uVar8 = uVar10;
        if ((int)uVar10 < 0) {
          uVar8 = -uVar10;
        }
        if ((int)uVar9 <= (int)uVar8) {
          uVar9 = uVar8;
        }
        uVar5 = calc_angle_quadrant(uVar6,-uVar10);
        uVar6 = calc_angle_quadrant(uVar9,((int)sVar2 - (int)sVar3) * -2);
        FUN_004e6ac0(param_1 + 0x3d,CONCAT22((short)(-uVar10 >> 0x10),uVar5) & 0xffff07ff,
                     uVar6 & 0xffff07ff,(int)*(short *)(param_1 + 0x6c));
      }
      local_10 = local_10 + 1;
    } while (local_10 < *(short *)(param_1 + 0x6a));
  }
  if (bVar4) {
LAB_004bb140:
    FUN_004bb290(param_1);
    update_after_unit_alloc(param_1);
  }
  return;
}
