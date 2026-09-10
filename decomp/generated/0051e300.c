/* Ghidra 12.1.3 pseudocode; entry 0051e300; FUN_0051e300.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_0051e300(int param_1,int param_2)

{
  byte bVar1;
  unit_struct *puVar2;
  char cVar3;
  int *piVar4;
  int iVar5;
  int local_324;
  int local_320 [200];

  bVar1 = *(byte *)(param_1 + 0x2f);
  cVar3 = '\0';
  if (*(char *)(param_2 + 0x2c) == '\x01') {
    puVar2 = unit_land_array[*(short *)(param_2 + 0x82)];
    iVar5 = 0;
    FUN_004b9d50(CONCAT22((short)((uint)puVar2 >> 0x10),(ushort)(byte)puVar2->field_0x9b),
                 (short)puVar2->coord_scale_4,local_320,&local_324);
    if (0 < local_324) {
      piVar4 = local_320;
      do {
        if (cVar3 != '\0') {
          return cVar3;
        }
        for (puVar2 = unit_land_array[*(short *)(*piVar4 + 6)]; puVar2 != (unit_struct *)0x0;
            puVar2 = unit_land_array[puVar2->next_unit_index]) {
          if (((puVar2->unit_class == '\x01') && (puVar2->tribe_index != -1)) &&
             ((uint)bVar1 != (int)(char)puVar2->tribe_index)) {
            cVar3 = '\x01';
            break;
          }
        }
        piVar4 = piVar4 + 2;
        iVar5 = iVar5 + 1;
      } while (iVar5 < local_324);
    }
  }
  else {
    cVar3 = *(char *)(param_2 + 0xa6);
  }
  return cVar3;
}
