/* Ghidra 12.1.3 pseudocode; entry 00502660; FUN_00502660.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00502660(int param_1)

{
  undefined2 *puVar1;
  uint uVar2;
  ushort uVar3;
  char cVar4;
  short sVar5;
  int iVar6;
  uint uVar7;

  if (*(short *)(param_1 + 0x9f) == 0) {
    FUN_004e7a80(param_1);
  }
  else {
    cVar4 = FUN_004a8220(param_1,*(short *)(param_1 + 0x9f));
    if (cVar4 == '\0') {
      *(undefined2 *)(param_1 + 0x9f) = 0;
    }
  }
  *(ushort *)(param_1 + 0x26) = *(short *)(param_1 + 0x98) + *(short *)(param_1 + 0x26) & 0x7ff;
  *(ushort *)(param_1 + 0x6c) = *(short *)(param_1 + 0x9a) + *(short *)(param_1 + 0x6c) & 0x7ff;
  *(ushort *)(param_1 + 0x6e) = *(short *)(param_1 + 0x9c) + *(short *)(param_1 + 0x6e) & 0x7ff;
  if ((*(byte *)(param_1 + 0x11) & 4) == 0) {
    puVar1 = (undefined2 *)(param_1 + 0x3d);
    uVar3 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*puVar1 >> 8));
    if ((*(byte *)(landscape_height_array +
                  ((&game_state.level_data[0].c_3)[((uVar3 & 0xfe) * 2 | uVar3 & 0xfe00) * 4] & 0xf)
                  ) & 2) == 0) {
      iVar6 = alloc_unit(7,3,*(undefined1 *)(param_1 + 0x2f),puVar1);
      if (iVar6 != 0) {
        FUN_0048a050(iVar6,0x13,0);
      }
      uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar2 = uVar7 >> 0xd;
      game_state.pseudo_random_val = uVar2 | uVar7 * 0x80000;
      if (((uVar2 & 1) == 0) && (0x1f < *(short *)(param_1 + 0x96))) {
        sVar5 = *(short *)(param_1 + 0x96) >> 1;
        *(short *)(param_1 + 0x96) = sVar5;
        *(short *)(param_1 + 0x4b) = sVar5;
        return;
      }
      update_after_unit_alloc(param_1);
      return;
    }
    update_after_unit_alloc(param_1);
    alloc_unit(7,0x41,*(undefined1 *)(param_1 + 0x2f),puVar1);
  }
  return;
}
