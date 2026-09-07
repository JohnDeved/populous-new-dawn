/* Ghidra 12.1.3 pseudocode; entry 004c2b40; struct_56B_get_spell_array_val.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


byte struct_56B_get_spell_array_val(int param_1,int param_2)

{
  return *(byte *)(param_2 + 0x96071e + param_1 * 0x38) & 0xf;
}
