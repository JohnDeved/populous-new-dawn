/* Ghidra 12.1.3 pseudocode; entry 00520480; FUN_00520480.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00520480(unit_struct *param_1,undefined4 param_2)

{
  char cVar1;
  byte bVar2;
  char cVar3;
  char cVar4;
  undefined1 uVar5;
  unit_struct *puVar6;
  undefined2 local_2;

  cVar1 = param_1->unit_type;
  bVar2 = param_1->tribe_index;
  cVar3 = param_1->state;
  cVar4 = param_1->field_0xa7;
  uVar5 = (undefined1)((ushort)(param_1->pos).x >> 8);
  if ((*(byte *)((int)&param_1->flags_4 + 1) & 8) == 0) {
    local_2 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),uVar5);
    for (puVar6 = unit_land_array
                  [(short)(&game_state.level_data[0].unit_index)
                          [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2]];
        puVar6 != (unit_struct *)0x0; puVar6 = unit_land_array[puVar6->next_unit_index]) {
      if ((((param_1 != puVar6) && (puVar6->unit_class == '\x01')) && (puVar6->unit_type == cVar1))
         && ((((int)(char)puVar6->tribe_index == (uint)bVar2 && (puVar6->state == cVar3)) &&
             ((*(short *)&puVar6->field_0x9b == 0 && (puVar6->field_0xa7 == cVar4)))))) {
        puVar6->flags_2 = puVar6->flags_2 | 0x10;
        FUN_00436d00(puVar6,param_2,0xffffffff);
      }
    }
  }
  else {
    local_2 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),uVar5);
    puVar6 = unit_land_array
             [(short)(&game_state.level_data[0].unit_index)
                     [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2]];
    if (puVar6 != (unit_struct *)0x0) {
      do {
        if (((param_1 != puVar6) && (puVar6->unit_class == '\x01')) &&
           ((puVar6->unit_type == cVar1 &&
            (((((*(byte *)((int)&puVar6->flags_4 + 1) & 8) != 0 &&
               ((int)(char)puVar6->tribe_index == (uint)bVar2)) && (puVar6->state == cVar3)) &&
             ((*(short *)&puVar6->field_0x9b == 0 && (puVar6->field_0xa7 == cVar4)))))))) {
          puVar6->flags_2 = puVar6->flags_2 | 0x10;
          FUN_00436d00(puVar6,param_2,0xffffffff);
        }
        puVar6 = unit_land_array[puVar6->next_unit_index];
      } while (puVar6 != (unit_struct *)0x0);
      return;
    }
  }
  return;
}
