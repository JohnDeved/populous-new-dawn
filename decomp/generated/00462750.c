/* Ghidra 12.1.3 pseudocode; entry 00462750; get_num_tribe_sub_struct_flag_1_set.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int get_num_tribe_sub_struct_flag_1_set(int param_1)

{
  int iVar1;
  int iVar2;
  byte *pbVar3;

  iVar1 = 0;
  pbVar3 = (byte *)(param_1 + 0x74);
  iVar2 = 10;
  do {
    if ((*pbVar3 & 1) != 0) {
      iVar1 = iVar1 + 1;
    }
    pbVar3 = pbVar3 + 0x52;
    iVar2 = iVar2 + -1;
  } while (iVar2 != 0);
  return iVar1;
}
