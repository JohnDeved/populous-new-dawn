/* Ghidra 12.1.3 pseudocode; entry 004a7170; FUN_004a7170.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a7170(int param_1)

{
  uint uVar1;
  bool bVar2;
  char cVar3;
  undefined2 uVar4;
  undefined4 in_EAX;
  undefined2 extraout_var;
  uint uVar5;
  short sVar6;
  int iVar7;
  bool bVar8;
  short local_8;
  short local_6;
  short local_4;

  uVar4 = (undefined2)((uint)in_EAX >> 0x10);
  bVar2 = false;
  bVar8 = false;
  if (((*(byte *)(param_1 + 0x35) & 0x10) == 0) && ((*(byte *)(param_1 + 0x10) & 0x10) == 0)) {
    FUN_0048a050(param_1,6,0x40);
    uVar4 = extraout_var;
  }
  if ((*(byte *)(param_1 + 0xc) & 4) != 0) {
    uVar4 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),
                              CONCAT22(uVar4,*(undefined2 *)(param_1 + 0x3f)));
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    *(undefined2 *)(param_1 + 0x41) = uVar4;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffb;
    cVar3 = FUN_0044f980((undefined2 *)(param_1 + 0x3d));
    if (cVar3 == '\0') {
      *(undefined2 *)(param_1 + 0x7c) = 10;
    }
  }
  if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
    uVar4 = FUN_004eebc0(player_tribe_num,param_1 + 0x3d);
    *(undefined2 *)(param_1 + 0x26) = uVar4;
  }
  FUN_004f0f60(param_1);
  if (*(short *)(param_1 + 0x7c) != 0) {
    sVar6 = *(short *)(param_1 + 0x7c) + -1;
    *(byte *)(param_1 + 0x90) = *(byte *)(param_1 + 0x90) | 4;
    *(short *)(param_1 + 0x7c) = sVar6;
    if (sVar6 < 0x1d) {
      bVar8 = sVar6 == 4;
      if (-1 < *(short *)(param_1 + 0x82)) {
        *(short *)(param_1 + 0x82) = (short)(*(int *)(param_1 + 0x7e) / -0x1c);
      }
      if (sVar6 == 0) {
        *(undefined2 *)(param_1 + 0x82) = 0;
        bVar2 = true;
      }
    }
  }
  sVar6 = *(short *)(param_1 + 0x82);
  if (sVar6 != 0) {
    *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 2;
    iVar7 = (int)sVar6 + *(int *)(param_1 + 0x68);
    *(int *)(param_1 + 0x68) = iVar7;
    if (sVar6 < 1) {
      if (iVar7 < 2) {
        *(undefined4 *)(param_1 + 0x68) = 1;
      }
    }
    else if (*(int *)(param_1 + 0x7e) <= iVar7) {
      *(undefined2 *)(param_1 + 0x82) = 0;
      *(int *)(param_1 + 0x68) = *(int *)(param_1 + 0x7e);
    }
  }
  if ((*(byte *)(param_1 + 0x90) & 1) == 0) {
    uVar5 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar1 = uVar5 >> 0xd;
    local_8 = *(short *)(param_1 + 0x3d) + ((ushort)uVar1 & 0x3f) + -0x20;
    uVar5 = (uVar1 | uVar5 * 0x80000) * 0x24a1 + 0x24df;
    uVar1 = uVar5 >> 0xd;
    game_state.pseudo_random_val = uVar1 | uVar5 * 0x80000;
    local_6 = ((ushort)uVar1 & 0x3f) + *(short *)(param_1 + 0x3f) + -0x20;
    local_4 = *(short *)(param_1 + 0x41) + 0x6e;
    iVar7 = alloc_unit(7,3,0xff,&local_8);
    if (iVar7 != 0) {
      if (*(short *)(param_1 + 0x7c) == 0) {
        *(uint *)(iVar7 + 0x10) = *(uint *)(iVar7 + 0x10) | 0x20000;
      }
      uVar5 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar1 = uVar5 >> 0xd;
      game_state.pseudo_random_val = uVar1 | uVar5 * 0x80000;
      *(ushort *)(iVar7 + 0x5f) = ((ushort)uVar1 & 0x1f) + 4;
    }
  }
  if ((bVar8) && ((*(byte *)(param_1 + 0x90) & 0x10) != 0)) {
    alloc_unit(7,0x4c,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
  }
  if (bVar2) {
    FUN_004a6e20(param_1);
  }
  return;
}
