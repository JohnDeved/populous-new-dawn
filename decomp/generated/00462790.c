/* Ghidra 12.1.3 pseudocode; entry 00462790; set_sub_struct.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_sub_struct(int param_1,int param_2,undefined1 param_3,undefined4 param_4,undefined4 param_5
                   ,undefined4 param_6,undefined2 param_7)

{
  int iVar1;
  uint uVar2;

  iVar1 = param_2 * 0x52 + param_1;
  uVar2 = *(uint *)(param_2 * 0x52 + 0x74 + param_1);
  *(uint *)(iVar1 + 0x74) = uVar2 | 1;
  *(uint *)(iVar1 + 0x74) = uVar2 & 0xfffffffd | 1;
  *(undefined1 *)(iVar1 + 0x85) = param_3;
  *(undefined4 *)(iVar1 + 0x68) = param_4;
  *(undefined4 *)(iVar1 + 0x6c) = param_5;
  *(undefined4 *)(iVar1 + 0x70) = param_6;
  *(undefined2 *)(iVar1 + 0x78) = param_7;
  FUN_00462ca0(param_1,param_2);
  return;
}
