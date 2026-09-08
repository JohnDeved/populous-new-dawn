/* Ghidra 12.1.3 pseudocode; entry 00405090; FUN_00405090.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00405090(ushort *param_1)

{
  *param_1 = (*param_1 & 0xfe00) + 0x100;
  param_1[1] = (param_1[1] & 0xfe00) + 0x100;
  return;
}
