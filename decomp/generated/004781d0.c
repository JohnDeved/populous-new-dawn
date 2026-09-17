/* Ghidra 12.1.3 pseudocode; entry 004781d0; FUN_004781d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004781d0(void)

{
  int iVar1;
  char cVar2;
  int iVar3;
  int iVar4;
  undefined4 local_8;
  undefined2 local_4;

  iVar3 = 0x89d1c8;
  iVar4 = 0;
  if (game_state.num_tribes != 0) {
    do {
      cVar2 = FUN_00419480(iVar4);
      if (cVar2 == '\0') {
        if ((*(byte *)(iVar3 + 0x93f) & 1) == 0) {
          local_8 = 0;
          local_4 = 0;
          ptr_unit_related_20B->field0_0x0 = iVar4;
          ptr_unit_related_20B->field1_0x4 = 0;
          ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
          ptr_unit_related_20B->field3_0xc = 0;
          ptr_unit_related_20B->field4_0x10 = 0;
          ptr_unit_related_20B = ptr_unit_related_20B + 1;
          unit_allocation_flag = 1;
          alloc_unit(7,0x4d,iVar4,&local_8);
          FUN_0044ff80(iVar3 + 0x911,0xffffffff,0);
        }
        if (*(int *)(iVar3 + 0x9ed) != 0) {
          for (iVar1 = *(int *)(iVar3 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
            if ((*(uint *)(iVar1 + 0x10) & 0x800) != 0) {
              FUN_004ef180(iVar1);
            }
          }
        }
      }
      iVar4 = iVar4 + 1;
      iVar3 = iVar3 + 0xc65;
    } while (iVar4 < (int)(uint)game_state.num_tribes);
  }
  return 1;
}
