/* Ghidra 12.1.3 pseudocode; entry 004851e0; load_level_units_post_processing_triggers.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_level_units_post_processing_triggers(void)

{
  byte bVar1;
  unit_struct *puVar2;
  bool bVar3;
  int iVar4;
  short *psVar5;
  unit_struct *puVar6;

  puVar2 = allocated_units;
  do {
    if (puVar2 == (unit_struct *)0x0) {
      return;
    }
    if ((puVar2->unit_class == '\x06') && (puVar2->unit_type == '\x06')) {
      bVar1 = puVar2->field_0x6d;
      psVar5 = &puVar2->coord_scale_2;
      iVar4 = 10;
      puVar2->field_0x6d = bVar1 & 0xef;
      puVar2->field_0x6d = bVar1 & 0xcf;
      do {
        if ((unit_struct *)(uint)(ushort)*psVar5 != (unit_struct *)0x0) {
          bVar3 = false;
          for (puVar6 = allocated_units; puVar6 != (unit_struct *)0x0; puVar6 = puVar6->next_unit_1)
          {
            if (puVar6->next_unit == (unit_struct *)(uint)(ushort)*psVar5) {
              bVar3 = true;
              break;
            }
          }
          if (bVar3) {
            *psVar5 = puVar6->unit_index;
            if ((puVar6->unit_class == '\x06') && (puVar6->unit_type == '\x02')) {
              if (*(char *)&puVar6->loc_2_x == '\x03') {
                puVar2->field_0x6d = puVar2->field_0x6d | 0x20;
              }
              else if (*(char *)&puVar6->loc_2_x == '\x01') {
                puVar2->field_0x6d = puVar2->field_0x6d | 0x10;
              }
            }
          }
          else {
            *psVar5 = 0;
          }
        }
        psVar5 = psVar5 + 1;
        iVar4 = iVar4 + -1;
      } while (iVar4 != 0);
      puVar6 = allocated_units;
      if (allocated_units != (unit_struct *)0x0) {
        do {
          if ((((puVar6->unit_class == '\x05') && (puVar6->unit_type == '\t')) &&
              ((((puVar2->pos).x ^ (puVar6->pos).x) & 0xfe00) == 0)) &&
             ((((puVar2->pos).y ^ (puVar6->pos).y) & 0xfe00) == 0)) break;
          puVar6 = puVar6->next_unit_1;
        } while (puVar6 != (unit_struct *)0x0);
        if (puVar6 != (unit_struct *)0x0) {
          FUN_004fbd20(puVar2,puVar6,0,1);
        }
      }
    }
    puVar2 = puVar2->next_unit_1;
  } while( true );
}
