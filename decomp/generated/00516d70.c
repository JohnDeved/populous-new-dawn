/* Ghidra 12.1.3 pseudocode; entry 00516d70; set_tribe_flag_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_tribe_flag_1(char param_1,byte param_2)

{
  byte *pbVar1;
  undefined1 local_200 [512];

  if ((((byte)land_flags_1 & 8) != 0) && (1 < game_state.offset_counter_2)) {
    printf_internal(local_200,DAT_00973038,struct_g1_ARRAY_00894da6 + param_1,
                    struct_g1_ARRAY_00894da6 + (char)param_2);
    set_tribe_str(param_1 * 0xc65 + 0x89d1c8,local_200);
  }
  pbVar1 = (byte *)((int)game_state.start_n1 + param_1 + 0x9c);
  *pbVar1 = *pbVar1 | '\x01' << (param_2 & 0x1f);
  return;
}
