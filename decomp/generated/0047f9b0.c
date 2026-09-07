/* Ghidra 12.1.3 pseudocode; entry 0047f9b0; make_rot_matrix3x3_z_axis.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void make_rot_matrix3x3_z_axis(ushort param_1,undefined4 *param_2)

{
  int iVar1;
  undefined4 *puVar2;
  undefined4 *puVar3;
  int local_48 [3];
  undefined4 local_3c;
  undefined4 local_38;
  undefined4 local_34;
  int local_30;
  undefined4 local_2c;
  int local_28;
  undefined4 local_24 [9];

  puVar2 = param_2;
  puVar3 = local_24;
  for (iVar1 = 9; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = *puVar2;
    puVar2 = puVar2 + 1;
    puVar3 = puVar3 + 1;
  }
  local_48[1] = 0;
  local_3c = 0;
  local_48[2] = maybe_sin[param_1 & 0x7ff] >> 2;
  local_48[0] = maybe_cos[param_1 & 0x7ff] >> 2;
  local_34 = 0;
  local_2c = 0;
  local_30 = -local_48[2];
  local_38 = 0x4000;
  local_28 = local_48[0];
  matrix3x3_mul(param_2,local_48,local_24);
  return;
}
