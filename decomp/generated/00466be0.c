/* Ghidra 12.1.3 pseudocode; entry 00466be0; FUN_00466be0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00466be0(int param_1)

{
  char cVar1;

  if (*(char *)(param_1 + 0xa0) != '\0') {
    *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 0x8000;
    cVar1 = *(char *)(param_1 + 0xa0) + '\x01';
    *(char *)(param_1 + 0xa0) = cVar1;
    if (((cVar1 == '\x04') &&
        ((unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15 & 1) == 0)) &&
       (*(short *)(param_1 + 0x41) < 1)) {
      alloc_unit(7,0x41,0xff,param_1 + 0x3d);
    }
    switch(*(undefined1 *)(param_1 + 0xa0)) {
    case 2:
      *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + -0x10;
      return;
    case 3:
      *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + -8;
      return;
    case 4:
      *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + -4;
      return;
    case 5:
      *(undefined1 *)(param_1 + 0xa0) = 0;
    }
  }
  return;
}
