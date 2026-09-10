/* Ghidra 12.1.3 pseudocode; entry 0051c3c0; FUN_0051c3c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined2 FUN_0051c3c0(int param_1,char *param_2,undefined1 *param_3,undefined4 param_4)

{
  unit_struct *puVar1;
  undefined2 uVar2;
  unit_struct *puVar3;

  uVar2 = 0;
  if (*param_2 == '\x1c') {
    puVar3 = (unit_struct *)0x0;
    if (((*(ushort *)(param_2 + 6) != 0) &&
        (puVar1 = unit_land_array[*(ushort *)(param_2 + 6)], (*(byte *)&puVar1->flags_2 & 1) == 0))
       && (puVar1->unit_class != '\0')) {
      puVar3 = puVar1;
    }
    if (puVar3 != (unit_struct *)0x0) {
      if (puVar3->unit_class == '\x01') {
        if (((*(char *)(param_1 + 0x2b) != '\x04') || (puVar3->unit_type == '\x04')) ||
           ((param_2[1] & 0x40U) != 0)) {
          if ((*(short *)&puVar3->field_0x9d != 0) &&
             (unit_land_array[*(short *)&puVar3->field_0x9d]->unit_type != '\t')) {
            *param_3 = 1;
            return *(undefined2 *)&puVar3->field_0x9d;
          }
          *param_3 = 2;
          return *(undefined2 *)(param_2 + 6);
        }
      }
      else {
        if (puVar3->unit_class != '\x02') {
          *param_3 = 0;
          return 0;
        }
        *param_3 = 3;
        uVar2 = *(undefined2 *)(param_2 + 6);
      }
    }
    return uVar2;
  }
  if (*(char *)(param_1 + 0x2b) == '\x06') {
    uVar2 = FUN_0051d0b0(param_1,param_2,param_3,param_4);
    return uVar2;
  }
  if (*(char *)(param_1 + 0x2b) != '\x04') {
    uVar2 = FUN_0051c4c0(param_1,param_2,param_3,param_4);
    return uVar2;
  }
  uVar2 = FUN_0051ce50();
  return uVar2;
}
