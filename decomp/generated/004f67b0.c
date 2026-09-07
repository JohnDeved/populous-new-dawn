/* Ghidra 12.1.3 pseudocode; entry 004f67b0; FUN_004f67b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f67b0(int param_1)

{
  int iVar1;
  int iVar2;

  iVar2 = 0;
  for (iVar1 = *(int *)(param_1 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
    if ((((*(uint *)&unit_type_related_1_ARRAY_005a6f78[*(byte *)(iVar1 + 0x2c)].field_0x1 & 8) != 0
         ) && (*(char *)(iVar1 + 0xaf) == '\0')) && (*(char *)(iVar1 + 0x2b) != '\a')) {
      iVar2 = iVar2 + 1;
    }
  }
  return iVar2;
}
