/* Ghidra 12.1.3 pseudocode; entry 004e59a0; FUN_004e59a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004e59a0(int param_1,undefined4 param_2)

{
  int iVar1;
  int iVar2;
  uint uVar3;
  short *psVar4;
  uint uVar5;
  uint uVar6;
  short local_8 [4];

  local_8[0] = 1;
  local_8[1] = 1;
  local_8[2] = 1;
  local_8[3] = 1;
  uVar5 = 0;
  iVar1 = FUN_004627f0(param_1,6,0);
  if (iVar1 != 0) {
    iVar1 = 0;
    do {
      iVar2 = FUN_00408dd0((int)*(short *)((int)&DAT_005d5508 + iVar1),
                           (int)*(char *)(param_1 + 0xc22));
      if ((((iVar2 == 0) ||
           ((int)((uint)*(byte *)(*(char *)(param_1 + 0xc22) * 0x30 + 0x9607ea +
                                 (int)*(short *)((int)&DAT_005d5500 + iVar1)) *
                 *(int *)(param_1 + 0x91d)) / 100 <=
            (int)*(short *)(param_1 + 0xa27 + *(short *)((int)&DAT_005d5510 + iVar1) * 2))) ||
          (*(short *)(param_1 + 0xb7d + *(short *)((int)&DAT_005d5508 + iVar1) * 2) < 1)) ||
         (iVar2 = FUN_004f36d0(param_1,(int)*(short *)((int)&DAT_005d5508 + iVar1)), iVar2 == 0)) {
        *(undefined2 *)((int)local_8 + iVar1) = 0;
      }
      iVar1 = iVar1 + 2;
    } while (iVar1 < 8);
    psVar4 = local_8;
    do {
      if (*psVar4 != 0) {
        uVar5 = uVar5 + 1;
      }
      psVar4 = psVar4 + 1;
    } while (psVar4 < &stack0x00000000);
    if (0 < (int)uVar5) {
      uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar3 >> 0xd | uVar3 * 0x80000;
      uVar3 = 0;
      uVar5 = game_state.pseudo_random_val % uVar5;
      psVar4 = local_8;
      do {
        uVar6 = uVar5;
        if ((*psVar4 != 0) && (uVar6 = uVar5 - 1, uVar5 = uVar3, uVar6 == 0xffffffff)) break;
        uVar5 = uVar6;
        psVar4 = psVar4 + 1;
        uVar3 = uVar3 + 1;
      } while (psVar4 < &stack0x00000000);
      iVar1 = FUN_004f67b0(param_1);
      iVar2 = FUN_004f6730(param_1);
      if (((int)(uint)(byte)unit_type_array_building[(short)(&DAT_005d5508)[uVar5]].field31_0x20 <=
           iVar2 + iVar1) &&
         (iVar1 = FUN_004f36d0(param_1,(int)(short)(&DAT_005d5508)[uVar5]), iVar1 != 0)) {
        set_sub_struct(param_1,param_2,6,iVar1,0,0,0);
        return 1;
      }
    }
  }
  return 0;
}
