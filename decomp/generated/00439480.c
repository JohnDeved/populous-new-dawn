/* Ghidra 12.1.3 pseudocode; entry 00439480; FUN_00439480.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00439480(int param_1)

{
  bool bVar1;
  uint uVar2;
  uint uVar3;
  undefined1 uVar4;

  uVar4 = 0;
  if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
    FUN_004d4f40(param_1);
  }
  if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
    uVar2 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar3 = (int)uVar2 >> 0x1f;
    if ((0x6f < (int)((uVar2 ^ uVar3) - uVar3)) ||
       (uVar2 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar3 = (int)uVar2 >> 0x1f, bVar1 = true, 0x6f < (int)((uVar2 ^ uVar3) - uVar3))) {
      bVar1 = false;
    }
    if (bVar1) {
      uVar4 = 1;
    }
  }
  return uVar4;
}
