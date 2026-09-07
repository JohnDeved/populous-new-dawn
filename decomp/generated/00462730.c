/* Ghidra 12.1.3 pseudocode; entry 00462730; get_tribe_sub_struct.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int get_tribe_sub_struct(int param_1)

{
  int iVar1;
  byte *pbVar2;

  iVar1 = 0;
  pbVar2 = (byte *)(param_1 + 0x74);
  do {
    if ((*pbVar2 & 1) == 0) {
      return iVar1;
    }
    pbVar2 = pbVar2 + 0x52;
    iVar1 = iVar1 + 1;
  } while (iVar1 < 10);
  return -1;
}
