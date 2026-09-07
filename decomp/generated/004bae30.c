/* Ghidra 12.1.3 pseudocode; entry 004bae30; unit_processing_class_8_shot.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_processing_class_8_shot(int param_1)

{
  unit_struct *puVar1;
  unit_struct *puVar2;

  if ((*(byte *)(param_1 + 0x6e) & 4) != 0) {
    puVar2 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0x98) != 0) &&
        (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x98)], (*(byte *)&puVar1->flags_2 & 1) == 0
        )) && (puVar1->unit_class != '\0')) {
      puVar2 = puVar1;
    }
    if (puVar2 == (unit_struct *)0x0) {
      *(undefined2 *)(param_1 + 0x98) = 0;
    }
    else {
      *(undefined4 *)(param_1 + 0x76) = *(undefined4 *)&puVar2->pos;
      *(undefined2 *)(param_1 + 0x7a) = (puVar2->pos).z;
    }
  }
  switch(*(undefined1 *)(param_1 + 0x2c)) {
  case 1:
    FUN_004baf00(param_1);
    return;
  case 2:
    FUN_004baf00(param_1);
    return;
  case 3:
    FUN_004bc890(param_1);
    return;
  case 4:
    FUN_004bb440(param_1);
    return;
  case 5:
    FUN_004bba20(param_1);
    return;
  case 7:
    FUN_004bc660(param_1);
  }
  return;
}
