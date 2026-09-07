/* Ghidra 12.1.3 pseudocode; entry 0041b8b0; FUN_0041b8b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0041b8b0(char param_1)

{
  char cVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;
  int iVar4;
  undefined4 local_8;
  undefined2 local_4;

  iVar4 = (int)param_1;
  DAT_0089d165 = param_1;
  if (0x20 < game_state.offset_counter_2) {
    sky_counter = 0x14;
  }
  puVar2 = allocated_units;
  if ((game_state.tribes_array[iVar4].field_0x93f & 1) == 0) {
    local_8 = 0;
    local_4 = 0;
    ptr_unit_related_20B->field0_0x0 = iVar4;
    ptr_unit_related_20B->field1_0x4 = 0;
    ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
    ptr_unit_related_20B->field3_0xc = 0;
    ptr_unit_related_20B->field4_0x10 = 0;
    ptr_unit_related_20B = ptr_unit_related_20B + 1;
    unit_allocation_flag = 1;
    alloc_unit(7,0x4d,param_1,&local_8);
    FUN_0044ff80(iVar4 * 0xc65 + 0x89dad9,0xffffffff,0);
    puVar2 = allocated_units;
  }
  do {
    while( true ) {
      do {
        puVar3 = puVar2;
        if (puVar3 == (unit_struct *)0x0) {
          return;
        }
        puVar2 = puVar3->next_unit_1;
      } while (puVar3->tribe_index != param_1);
      cVar1 = puVar3->unit_class;
      if (cVar1 == '\x01') break;
      if (cVar1 == '\x02') {
        puVar3->field_0x9c = puVar3->field_0x9c | 0x40;
        *(ushort *)&puVar3->field_0x9e =
             *(short *)&unit_type_array_building[(byte)puVar3->unit_type].field_0x2e +
             (puVar3->unit_index & 0xf) * -0x10;
      }
      else if (((cVar1 == '\n') && (puVar3->unit_type == '\f')) &&
              (*(char *)((int)&puVar3->obj_index_anim_prev + 1) == '\a')) {
LAB_0041b9dc:
        FUN_004ef180(puVar3);
      }
    }
    if ((puVar3->flags_4 & 0x800) != 0) goto LAB_0041b9dc;
    if (puVar3->unit_type == '\b') {
      *(undefined2 *)&puVar3->field_0x6e = 2;
    }
  } while( true );
}
