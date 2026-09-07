/* Ghidra 12.1.3 pseudocode; entry 00419480; FUN_00419480.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_00419480(int param_1)

{
  uint3 uVar1;

  uVar1 = (uint3)((uint)(param_1 * 0xc65 + 0x89d1c8) >> 8);
  if ((game_state.tribes_array[param_1].field_0xc20 != '\0') &&
     ((int)game_state.tribes_array[param_1].f_949 < 0x61)) {
    return (uint)uVar1 << 8;
  }
  return CONCAT31(uVar1,1);
}
