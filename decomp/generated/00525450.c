/* Ghidra 12.1.3 pseudocode; entry 00525450; FUN_00525450.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00525450(int param_1,int param_2,int param_3)

{
  short sVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  undefined1 auStack_3c [8];
  int local_20;
  int local_1c;
  int local_18;
  int local_14;
  undefined1 *local_10;
  undefined1 *local_c;
  undefined1 *local_8;
  undefined1 *local_4;

  iVar3 = param_2 + -3;
  sVar1 = *(short *)(param_1 + 0x6e);
  iVar2 = (int)*(short *)(param_1 + 0x6c);
  local_20 = param_2 + -2;
  iVar4 = param_3 + -0x1a;
  local_18 = param_2 + 2;
  local_1c = param_3 + -0x19;
  local_14 = param_3 + -1;
  vertices_flags = vertices_flags | 0x10;
  set_indexed_value_from_system_palette(0x9a);
  FUN_00516890(&local_20);
  local_10 = auStack_3c;
  FUN_004525d0(0x9d);
  set_texture_4(iVar3,iVar4,iVar3,param_3);
  local_c = auStack_3c;
  FUN_004525d0(0x9d);
  set_texture_4(iVar3,iVar4,param_2 + 3,iVar4);
  local_8 = auStack_3c;
  FUN_004525d0(0x96);
  set_texture_4(param_2 + 2,iVar4,param_2 + 2,param_3 + -1);
  local_4 = auStack_3c;
  FUN_004525d0(0x96);
  set_texture_4(iVar3,param_3 + -1,param_2 + 3,param_3 + -1);
  vertices_flags = vertices_flags & 0xffffffef;
  if (iVar2 == 0) {
    iVar2 = 1;
  }
  local_20 = param_2 + -2;
  local_18 = param_2 + 2;
  local_14 = param_3 + -1;
  local_1c = param_3 + (sVar1 * -0x18) / iVar2 + -1;
  set_indexed_value_from_system_palette(global_palette_indexes);
  FUN_00516890(&local_20);
  return;
}
