/* Ghidra 12.1.3 pseudocode; entry 0042dae0; tex_struct_convert_to_tex_coords.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall
tex_struct_convert_to_tex_coords(int param_1,int param_2,int param_3,int *param_4,int *param_5)

{
  int iVar1;
  float fVar2;
  float fVar3;
  float fVar4;
  int local_24;
  int local_20 [8];

  if (*(int *)(param_1 + 0x20) != 0) {
    (**(code **)(param_1 + 0x24))(param_2,param_3,local_20,&local_24);
  }
  fVar2 = (float)((param_2 - *(int *)(param_1 + 0x18)) * 0x10000 >> 0x10) * FLOAT_0058f218;
  fVar3 = (float)((param_3 - *(int *)(param_1 + 0x1c)) * 0x10000 >> 0x10) * FLOAT_0058f218;
  fVar4 = *(float *)(param_1 + 0x34) / (fVar2 * fVar2 + fVar3 * fVar3 + *(float *)(param_1 + 0x30));
  *param_4 = *(int *)(param_1 + 0x10) + (int)ROUND(fVar4 * fVar2);
  *param_5 = *(int *)(param_1 + 0x14) + (int)ROUND(fVar4 * fVar3);
  iVar1 = *(int *)(param_1 + 0x20);
  if (iVar1 != 0) {
    *param_4 = (0x100 - iVar1) * *param_4 + iVar1 * local_20[0] >> 8;
    *param_5 = (0x100 - *(int *)(param_1 + 0x20)) * *param_5 + *(int *)(param_1 + 0x20) * local_24
               >> 8;
  }
  *param_5 = *(int *)(param_1 + 0xc) - *param_5;
  return;
}
