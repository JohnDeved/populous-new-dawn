/* Ghidra 12.1.3 pseudocode; entry 00479840; FUN_00479840.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00479840(int param_1)

{
  if (((byte)land_flags_1 & 8) != 0) {
    FUN_004ef180(param_1);
    return;
  }
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x4c;
    init_unit_class(param_1);
  }
  *(undefined1 *)(param_1 + 0x2d) = 0;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  return;
}
