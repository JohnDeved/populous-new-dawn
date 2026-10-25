/* Ghidra 12.1.3 pseudocode; entry 004a1340; FUN_004a1340.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a1340(int param_1)

{
  int iVar1;
  int iVar2;

  iVar1 = *(int *)(param_1 + 99) % 5 + 1;
  iVar2 = *(int *)(param_1 + 99) / 5;
  if (((DAT_009845bb == '\0') || (DAT_009846bb != '\0')) &&
     ((DAT_009845c7 == '\0' || (DAT_009846c7 != '\0')))) {
    func_0x004de810(iVar2,iVar1,0);
    return;
  }
  func_0x004de810(iVar2,iVar1,1);
  return;
}
