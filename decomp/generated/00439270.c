/* Ghidra 12.1.3 pseudocode; entry 00439270; FUN_00439270.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_00439270(int param_1)

{
  short *psVar1;

  if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
    FUN_004d4f40(param_1);
  }
  psVar1 = (short *)(param_1 + 0x70);
  *psVar1 = *psVar1 + -1;
  return *psVar1 == 0;
}
