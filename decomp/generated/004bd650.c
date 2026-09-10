/* Ghidra 12.1.3 pseudocode; entry 004bd650; alloc_and_clear_res_5_6.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void alloc_and_clear_res_5_6(int param_1)

{
  res_5_item *prVar1;
  int iVar2;
  res_6_item *prVar3;

  if (param_1 != 0) {
    if ((resource_flags & 4) == 0) {
      res_array_5 = (res_5_item *)malloc_1(0x80000);
      res_array_6 = (res_6_item *)malloc_1(0x28000);
      resource_flags = resource_flags | 4;
    }
    iVar2 = 0x10000;
    prVar1 = res_array_5;
    do {
      prVar1->next_index = -1;
      prVar1 = prVar1 + 1;
      iVar2 = iVar2 + -1;
    } while (iVar2 != 0);
    iVar2 = 0x4000;
    prVar3 = res_array_6;
    do {
      prVar3->res_5_index_2 = -1;
      iVar2 = iVar2 + -1;
      prVar3->res_5_index = -1;
      prVar3->counter = 0;
      prVar3 = prVar3 + 1;
    } while (iVar2 != 0);
    res_5_6_index = 0;
    return;
  }
  if ((resource_flags & 4) != 0) {
    free_1(res_array_5);
    free_1(res_array_6);
    resource_flags = resource_flags & 0xfffffffb;
  }
  return;
}
