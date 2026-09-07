/* Ghidra 12.1.3 pseudocode; entry 0047fa30; create_y_rot_matrix3x3.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void create_y_rot_matrix3x3(ushort param_1,undefined4 *param_2)

{
  int iVar1;
  undefined4 *puVar2;
  undefined4 *puVar3;
  int local_48;
  int local_44;
  undefined4 local_40;
  int local_3c;
  int local_38;
  undefined4 local_34;
  undefined4 local_30;
  undefined4 local_2c;
  undefined4 local_28;
  undefined4 local_24 [9];

  puVar2 = param_2;
  puVar3 = local_24;
  for (iVar1 = 9; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = *puVar2;
    puVar2 = puVar2 + 1;
    puVar3 = puVar3 + 1;
  }
  local_3c = maybe_sin[param_1 & 0x7ff] >> 2;
  local_48 = maybe_cos[param_1 & 0x7ff] >> 2;
  local_44 = -local_3c;
  local_40 = 0;
  local_34 = 0;
  local_30 = 0;
  local_2c = 0;
  local_28 = 0x4000;
  local_38 = local_48;
  matrix3x3_mul(param_2,&local_48,local_24);
  return;
}
