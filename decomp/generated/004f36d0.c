/* Ghidra 12.1.3 pseudocode; entry 004f36d0; FUN_004f36d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined2 FUN_004f36d0(int param_1,uint param_2)

{
  undefined2 uVar1;
  int iVar2;

  uVar1 = 0;
  iVar2 = *(int *)(param_1 + 0x885);
  if (iVar2 != 0) {
    while ((*(byte *)(iVar2 + 0x2b) != param_2 || (*(char *)(iVar2 + 0x2c) != '\x02'))) {
      iVar2 = *(int *)(iVar2 + 8);
      if (iVar2 == 0) {
        return uVar1;
      }
    }
    uVar1 = *(undefined2 *)(iVar2 + 0x24);
  }
  return uVar1;
}
