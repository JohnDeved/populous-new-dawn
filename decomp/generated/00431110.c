/* Ghidra 12.1.3 pseudocode; entry 00431110; FUN_00431110.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00431110(void)

{
  int iVar1;

  if ((((byte)land_flags_1 & 4) == 0) && (iVar1 = DAT_00683b70, DAT_006841e3 != '\0')) {
    for (; iVar1 != 0; iVar1 = *(int *)(iVar1 + 0x25)) {
      FUN_0049f9c0(iVar1);
    }
  }
  return;
}
