/* Ghidra 12.1.3 pseudocode; entry 004e6a70; move_pos_angle_length.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void move_pos_angle_length(short *param_1,ushort param_2,short param_3)

{
  if (param_3 != 0) {
    *param_1 = *param_1 + (short)((uint)(maybe_sin[param_2 & 0x7ff] * (int)param_3) >> 0x10);
    param_1[1] = param_1[1] + (short)((uint)(maybe_cos[param_2 & 0x7ff] * (int)param_3) >> 0x10);
  }
  return;
}
