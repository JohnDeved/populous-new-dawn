/* Ghidra 12.1.3 pseudocode; entry 00527a30; FUN_00527a30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00527a30(sprite_entry *param_1,uint *param_2,int param_3)

{
  *param_2 = (uint)(ushort)param_1[param_3 + -0x20].width;
  param_2[1] = (uint)(ushort)param_1[param_3 + -0x20].height;
  return;
}
