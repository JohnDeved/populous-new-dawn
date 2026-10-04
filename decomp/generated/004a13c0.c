/* Ghidra 12.1.3 pseudocode; entry 004a13c0; FUN_004a13c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a13c0(int param_1)

{
  uint uVar1;
  int iVar2;
  undefined4 uVar3;
  uint uVar4;

  if (DAT_0089c6c1 != 2) {
    uVar1 = *(uint *)(param_1 + 99);
    uVar4 = (int)uVar1 >> 0x1f;
    iVar2 = ((uVar1 ^ uVar4) - uVar4 & 7 ^ uVar4) - uVar4;
    uVar3 = 1;
    if (7 < (int)uVar1) {
      uVar3 = 3;
    }
    if (((DAT_009845bb != '\0') && (DAT_009846bb == '\0')) ||
       ((DAT_009845c7 != '\0' && (DAT_009846c7 == '\0')))) {
      if (iVar2 != 0) {
        FUN_00451080(4,0,uVar3,iVar2);
        return;
      }
      FUN_00451080(4,0,uVar3,0);
      return;
    }
    if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) ||
       ((DAT_0098462e != '\0' && (DAT_0098472e == '\0')))) {
      if (iVar2 != 0) {
        FUN_00451080(5,0,uVar3,iVar2);
        return;
      }
      FUN_00451080(5,0,uVar3,0);
      return;
    }
    if (iVar2 != 0) {
      FUN_00451080(0,0,uVar3,iVar2);
      return;
    }
    FUN_00451080(0,0,uVar3,0);
  }
  return;
}
