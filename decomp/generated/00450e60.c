/* Ghidra 12.1.3 pseudocode; entry 00450e60; FUN_00450e60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00450e60(int param_1,undefined4 param_2,undefined4 param_3)

{
  undefined2 uVar1;
  vfra_struct *pvVar2;
  int iVar3;
  undefined4 uVar4;
  int iVar5;

  iVar5 = (int)*(char *)(param_1 + 0x2f);
  iVar3 = (int)*(short *)(param_1 + 0x33) +
          ((((int)(short)tribe_ptr->angle_1 - (int)*(short *)(param_1 + 0x26)) - 0x380U & 0x700) >>
          8);
  if (*(char *)(param_1 + 0x2b) == '\a') {
    iVar3 = iVar3 + iVar5 * 8;
    iVar5 = -1;
  }
  uVar4 = 2;
  if (vstart_related[iVar3].index_2 != '\0') {
    uVar4 = 3;
  }
  pvVar2 = vstart_related[iVar3].vfra_ptr;
  uVar1 = (&pvVar2->index)[*(byte *)(param_1 + 0x39)];
  human_anim_draw_mode = 2;
  if (iVar5 != -1) {
    if (obj_related_array[*(byte *)(param_1 + 0x3a) + 3].person_type_1 == '\0') {
      set_human_anim_tribe(uVar1,param_2,param_3,uVar4,iVar5);
      return;
    }
    set_human_anim_tribe_person
              (uVar1,param_2,param_3,uVar4,iVar5,
               obj_related_array[*(byte *)(param_1 + 0x3a) + 3].person_type_1,
               CONCAT31((int3)((uint)pvVar2 >> 8),
                        obj_related_array[*(byte *)(param_1 + 0x3a) + 3].person_type_2));
    return;
  }
  set_human_anim_no_tribe(uVar1,param_2,param_3,uVar4);
  return;
}
