/* Ghidra 12.1.3 pseudocode; entry 0041b380; FUN_0041b380.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0041b380(int param_1)

{
  return (int)*(short *)(param_1 + 0xa2b) * (int)unit_type_array_person[2].conv +
         (int)*(short *)(param_1 + 0xa2d) * (int)unit_type_array_person[3].conv +
         (int)*(short *)(param_1 + 0xa2f) * (int)unit_type_array_person[4].conv +
         (int)*(short *)(param_1 + 0xa31) * (int)unit_type_array_person[5].conv + 1 +
         (int)*(short *)(param_1 + 0xa33) * (int)unit_type_array_person[6].conv;
}
