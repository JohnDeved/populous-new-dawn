/* Ghidra 12.1.3 pseudocode; entry 0042dd50; tex_struct_fn_3.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 __thiscall tex_struct_fn_3(int param_1,int param_2,int param_3,int *param_4,int *param_5)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int local_8;
  int local_4;

  iVar2 = (param_2 - *(int *)(param_1 + 0x18)) * 0x10000 >> 0x14;
  iVar1 = (param_3 - *(int *)(param_1 + 0x1c)) * 0x10000 >> 0x14;
  iVar3 = *(int *)(param_1 + 0x104) >> 4;
  if (iVar2 * iVar2 + iVar1 * iVar1 < iVar3 * iVar3) {
    tex_struct_convert_to_tex_coords(param_2,param_3,param_4,param_5);
  }
  else {
    if (*(int *)(param_1 + 0x20) != 0) {
      (**(code **)(param_1 + 0x24))(param_2,param_3,&local_8,&local_4);
    }
    iVar1 = __ftol();
    *param_4 = *(int *)(param_1 + 0x10) + iVar1;
    iVar1 = __ftol();
    *param_5 = *(int *)(param_1 + 0x14) + iVar1;
    iVar1 = *(int *)(param_1 + 0x20);
    if (iVar1 != 0) {
      *param_4 = (0x100 - iVar1) * *param_4 + local_8 * iVar1 >> 8;
      *param_5 = (0x100 - *(int *)(param_1 + 0x20)) * *param_5 + local_4 * *(int *)(param_1 + 0x20)
                 >> 8;
      return 0;
    }
  }
  return 1;
}
