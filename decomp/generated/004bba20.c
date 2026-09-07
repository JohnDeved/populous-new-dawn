/* Ghidra 12.1.3 pseudocode; entry 004bba20; FUN_004bba20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004bbab8) */
/* WARNING: Removing unreachable block (ram,0x004bbac2) */

void FUN_004bba20(int param_1)

{
  ushort uVar1;
  undefined2 uVar2;
  short sVar3;
  uint uVar4;
  undefined4 uVar5;
  uint uVar6;
  uint uVar7;
  int iVar8;
  uint uVar9;
  int local_20;
  short local_10;
  short sStack_e;
  short local_c;
  short local_8;
  short sStack_6;
  short local_4;

  if (*(char *)(param_1 + 0x2d) == '\0') {
    *(undefined4 *)(param_1 + 0x3d) = *(undefined4 *)(param_1 + 0x70);
    *(undefined2 *)(param_1 + 0x41) = *(undefined2 *)(param_1 + 0x74);
  }
  local_10 = *(short *)(param_1 + 0x3d);
  local_c = *(short *)(param_1 + 0x41);
  *(char *)(param_1 + 0x2d) = *(char *)(param_1 + 0x2d) + '\x01';
  local_20 = 1;
  sStack_e = *(short *)(param_1 + 0x3f);
  if (1 < *(short *)(param_1 + 0x6a)) {
    do {
      if (*(short *)(param_1 + 0x6a) - local_20 == 1) {
        iVar8 = *(int *)(param_1 + 0x76);
        local_4 = *(short *)(param_1 + 0x7a);
        local_8 = (short)iVar8;
        sStack_6 = (short)((uint)iVar8 >> 0x10);
      }
      else {
        uVar7 = (uint)(ushort)(*(short *)(param_1 + 0x76) - local_10);
        uVar6 = (uint)(ushort)(*(short *)(param_1 + 0x78) - sStack_e);
        if (0x7fff < uVar7) {
          uVar7 = uVar7 - 0x10000;
        }
        if (0x7fff < uVar6) {
          uVar6 = uVar6 - 0x10000;
        }
        uVar9 = uVar7;
        if ((int)uVar7 < 0) {
          uVar9 = -uVar7;
        }
        uVar4 = uVar6;
        if ((int)uVar6 < 0) {
          uVar4 = -uVar6;
        }
        if ((int)uVar9 <= (int)uVar4) {
          uVar9 = uVar4;
        }
        iVar8 = ((int)*(short *)(param_1 + 0x7a) - (int)local_c) * -2;
        uVar1 = calc_angle_quadrant(uVar7,-uVar6);
        uVar2 = calc_angle_quadrant(uVar9,iVar8);
        uVar4 = CONCAT22((short)((uint)iVar8 >> 0x10),uVar2) & 0xffff07ff;
        uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar7 = uVar6 >> 0xd;
        uVar9 = (uVar7 | uVar6 * 0x80000) * 0x24a1 + 0x24df;
        uVar6 = uVar9 >> 0xd;
        game_state.pseudo_random_val = uVar6 | uVar9 * 0x80000;
        uVar5 = FUN_004504b0(param_1 + 0x76,&local_10);
        uVar9 = fast_sqrt(uVar5);
        *(short *)(param_1 + 0x6c) = (short)(uVar9 / (uint)(*(short *)(param_1 + 0x6a) - local_20));
        local_8 = local_10;
        sStack_6 = sStack_e;
        local_4 = local_c;
        FUN_004e6ac0(&local_8,(uVar1 & 0x7ff) + (((ushort)uVar7 & 0xff) - 0x80),
                     CONCAT22((short)(uVar4 >> 0x10),(short)uVar4 + (((ushort)uVar6 & 0xff) - 0x80))
                     ,(int)*(short *)(param_1 + 0x6c));
        sVar3 = calc_point_height(CONCAT22(sStack_6,local_8),CONCAT22(local_4,sStack_6));
        iVar8 = (int)sVar3;
        if ((int)local_4 < iVar8 + 0x100) {
          uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar7 = uVar6 >> 0xd;
          game_state.pseudo_random_val = uVar7 | uVar6 * 0x80000;
          local_4 = ((ushort)uVar7 & 0xff) + sVar3 + 0x100;
        }
      }
      iVar8 = alloc_unit(7,0x2a,CONCAT31((int3)((uint)iVar8 >> 8),*(undefined1 *)(param_1 + 0x2f)),
                         &local_10);
      if (iVar8 != 0) {
        *(short *)(iVar8 + 0x49) = local_8 - local_10;
        *(short *)(iVar8 + 0x4d) = sStack_6 - sStack_e;
        *(short *)(iVar8 + 0x4b) = local_4 - local_c;
      }
      local_20 = local_20 + 1;
      local_10 = local_8;
      sStack_e = sStack_6;
      local_c = local_4;
    } while (local_20 < *(short *)(param_1 + 0x6a));
  }
  if (2 < *(byte *)(param_1 + 0x2d)) {
    FUN_004bb290(param_1);
    update_after_unit_alloc(param_1);
  }
  return;
}
