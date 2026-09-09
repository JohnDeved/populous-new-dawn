/* Ghidra 12.1.3 pseudocode; entry 00406f40; alloc_spell_blast_or_sinking.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void alloc_spell_blast_or_sinking(int param_1)

{
  char cVar1;
  int iVar2;

  cVar1 = *(char *)(param_1 + 0x67) + -1;
  *(char *)(param_1 + 0x67) = cVar1;
  if (cVar1 == '\x01') {
    cVar1 = *(char *)(param_1 + 0xa6);
    while (cVar1 != '\0') {
      remove_person_from_hut(param_1,0);
      cVar1 = *(char *)(param_1 + 0xa6);
    }
  }
  if (*(char *)(param_1 + 0x67) < '\x01') {
    if (*(char *)(param_1 + 0x2d) == '\x01') {
      FUN_00407860(param_1,0,1,0xffffffff,0,0,0xffffffff,0xffffffff,0);
      iVar2 = alloc_unit(7,1,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
      if (iVar2 != 0) {
        FUN_0050b6f0(iVar2,3,2,5,0x62,0x8c,1,0);
      }
    }
    else if (*(char *)(param_1 + 0x2d) == '\x02') {
      ptr_unit_related_20B->field0_0x0 = param_1;
      ptr_unit_related_20B->field1_0x4 = 0;
      ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
      ptr_unit_related_20B->field3_0xc = 0;
      ptr_unit_related_20B->field4_0x10 = 0;
      ptr_unit_related_20B = ptr_unit_related_20B + 1;
      unit_allocation_flag = 1;
      alloc_unit(10,0x13,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
    }
    if ((*(byte *)(param_1 + 0x14) & 0x40) == 0) {
      FUN_00403860(param_1);
      if (*(char *)(param_1 + 0xaf) != -1) {
        FUN_0041b550(*(char *)(param_1 + 0xaf),4,1);
      }
    }
    update_after_unit_alloc(param_1);
  }
  return;
}
