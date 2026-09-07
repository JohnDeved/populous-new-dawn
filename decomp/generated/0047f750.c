/* Ghidra 12.1.3 pseudocode; entry 0047f750; mul_matrix_vector.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void mul_matrix_vector(int *param_1,int *param_2,int *param_3)

{
  *param_1 = param_2[1] * param_3[1] + param_2[2] * param_3[2] + *param_3 * *param_2;
  param_1[1] = param_2[5] * param_3[2] + param_2[3] * *param_3 + param_2[4] * param_3[1];
  param_1[2] = param_2[7] * param_3[1] + param_2[8] * param_3[2] + param_2[6] * *param_3;
  return;
}
