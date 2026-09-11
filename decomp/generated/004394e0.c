/* Ghidra 12.1.3 pseudocode; entry 004394e0; FUN_004394e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004394e0(int param_1)

{
  short *psVar1;
  bool bVar2;
  uint uVar3;
  uint uVar4;
  undefined1 uVar5;

  uVar5 = 0;
  if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
    FUN_004d4f40(param_1);
  }
  if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
    uVar3 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar4 = (int)uVar3 >> 0x1f;
    if ((0x6f < (int)((uVar3 ^ uVar4) - uVar4)) ||
       (uVar3 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar4 = (int)uVar3 >> 0x1f, bVar2 = true, 0x6f < (int)((uVar3 ^ uVar4) - uVar4))) {
      bVar2 = false;
    }
    if (bVar2) {
      uVar5 = 1;
    }
  }
  psVar1 = (short *)(param_1 + 0x70);
  *psVar1 = *psVar1 + -1;
  if (*psVar1 == 0) {
    uVar5 = 1;
  }
  return uVar5;
}
