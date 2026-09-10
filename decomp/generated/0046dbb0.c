/* Ghidra 12.1.3 pseudocode; entry 0046dbb0; FUN_0046dbb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


float10 FUN_0046dbb0(int param_1,int param_2,int param_3)

{
  return ((float10)*(float *)(param_3 + 0x10) - (float10)*(float *)(param_2 + 0x10)) *
         ((float10)*(float *)(param_2 + 0xc) - (float10)*(float *)(param_1 + 0xc)) -
         ((float10)*(float *)(param_3 + 0xc) - (float10)*(float *)(param_2 + 0xc)) *
         ((float10)*(float *)(param_2 + 0x10) - (float10)*(float *)(param_1 + 0x10));
}
