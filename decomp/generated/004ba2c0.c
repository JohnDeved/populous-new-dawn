/* Ghidra 12.1.3 pseudocode; entry 004ba2c0; FUN_004ba2c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004ba2c0(int param_1,int param_2)

{
  char cVar1;
  unit_struct *puVar2;
  bool bVar3;
  char cVar4;
  unit_struct *puVar5;
  short sVar6;
  unit_struct *puVar7;
  undefined1 local_1;

  puVar7 = (unit_struct *)0x0;
  local_1 = 0;
  bVar3 = false;
  if (param_2 != 0) {
    sVar6 = *(short *)(param_1 + 0x96) + (short)param_2;
    *(short *)(param_1 + 0x96) = sVar6;
    if (((*(ushort *)(param_1 + 0x92) != 0) &&
        (puVar5 = unit_land_array[*(ushort *)(param_1 + 0x92)], (*(byte *)&puVar5->flags_2 & 1) == 0
        )) && (puVar5->unit_class != '\0')) {
      puVar7 = puVar5;
    }
    if (puVar7 != (unit_struct *)0x0) {
      cVar1 = puVar7->field_0x78;
      if ((int)sVar6 <
          (int)(uint)*(ushort *)&unit_type_array_building[(byte)puVar7->unit_type].field_0x1a) {
        if (sVar6 < 1) {
          bVar3 = true;
          puVar7->field_0x78 = 0;
        }
        else {
          cVar4 = (char)((sVar6 * 4 + -1) /
                        (int)(*(ushort *)
                               &unit_type_array_building[(byte)puVar7->unit_type].field_0x1a - 1));
          puVar7->field_0x78 = cVar4;
          if (cVar4 < '\0') {
            puVar7->field_0x78 = 0;
          }
          if ('\x03' < (char)puVar7->field_0x78) {
            puVar7->field_0x78 = 3;
          }
        }
        if (puVar7->field_0x78 != cVar1) {
          landscape_move_1(puVar7,1);
        }
      }
      else {
        puVar7->field_0x78 = 4;
        if ((*(byte *)((int)&puVar7->flags_2 + 2) & 0x10) == 0) {
          empty_unit_function(puVar7);
          puVar7->state = 2;
          init_unit_class(puVar7);
        }
      }
      if ((bVar3) || (puVar7->field_0x78 != cVar1)) {
        puVar5 = (unit_struct *)0x0;
        local_1 = 1;
        if ((puVar7->facs0_index != 0) &&
           ((puVar2 = unit_land_array[(ushort)puVar7->facs0_index],
            (*(byte *)&puVar2->flags_2 & 1) == 0 && (puVar2->unit_class != '\0')))) {
          puVar5 = puVar2;
        }
        if (puVar5 != (unit_struct *)0x0) {
          puVar5->field_0x78 = puVar7->field_0x78;
        }
      }
      if (0 < param_2) {
        *(undefined1 *)(param_1 + 0xa0) = 0xff;
        puVar7->field_0xaf = 0xff;
      }
    }
  }
  return local_1;
}
