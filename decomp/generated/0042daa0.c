/* Ghidra 12.1.3 pseudocode; entry 0042daa0; tex_struct_is_point_visible.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool __thiscall tex_struct_is_point_visible(int param_1,int param_2,int param_3)

{
  int iVar1;
  int iVar2;
  int iVar3;

  iVar3 = (param_3 - *(int *)(param_1 + 0x1c)) * 0x10000 >> 0x14;
  iVar2 = (param_2 - *(int *)(param_1 + 0x18)) * 0x10000 >> 0x14;
  iVar1 = *(int *)(param_1 + 0x104) >> 4;
  return iVar3 * iVar3 + iVar2 * iVar2 < iVar1 * iVar1;
}
