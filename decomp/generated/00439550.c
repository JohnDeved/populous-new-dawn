/* Ghidra 12.1.3 pseudocode; entry 00439550; FUN_00439550.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_00439550(uint param_1)

{
  if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
    param_1 = FUN_004d4ee0(param_1);
  }
  return param_1 & 0xffffff00;
}
