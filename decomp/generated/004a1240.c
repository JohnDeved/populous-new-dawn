/* Ghidra 12.1.3 pseudocode; entry 004a1240; FUN_004a1240.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a1240(int param_1)

{
  int iVar1;
  int iVar2;
  int iVar3;

  iVar3 = 0;
  if ((DAT_0089c6c1 != 2) && (iVar2 = *(int *)(param_1 + 99), -1 < iVar2)) {
    iVar1 = iVar2 % 5 + 1;
    if (4 < iVar2) {
      iVar3 = iVar2 / 5;
    }
    if (((DAT_009845bb != '\0') && (DAT_009846bb == '\0')) ||
       ((DAT_009845c7 != '\0' && (DAT_009846c7 == '\0')))) {
      if (iVar3 != 0) {
        func_0x00450f30(3,0,iVar3,iVar1);
        return;
      }
      func_0x00450f30(2,0,0,iVar1);
      return;
    }
    if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) ||
       ((DAT_0098462e != '\0' && (DAT_0098472e == '\0')))) {
      if (iVar3 != 0) {
        func_0x00450f30(5,0,iVar3,iVar1);
        return;
      }
      func_0x00450f30(5,0,0,iVar1);
      return;
    }
    if (iVar3 != 0) {
      func_0x00450f30(0,0,iVar3,iVar1);
      return;
    }
    func_0x00450f30(0,0,0,iVar1);
  }
  return;
}
