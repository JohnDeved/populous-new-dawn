/* Ghidra 12.1.3 pseudocode; entry 004c2b60; set_struct_56B_array_spell_val.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_struct_56B_array_spell_val(int param_1,int param_2,int param_3)

{
  byte *pbVar1;
  byte bVar2;

  if (0xf < param_3) {
    param_3 = 0xf;
  }
  pbVar1 = (byte *)(param_2 + 0x96071e + param_1 * 0x38);
  bVar2 = *pbVar1;
  *pbVar1 = bVar2 & 0xf0;
  *pbVar1 = (byte)param_3 | bVar2 & 0xf0;
  return;
}
