/* Ghidra 12.1.3 pseudocode; entry 004a66c0; FUN_004a66c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a66c0(int param_1,undefined4 param_2,ushort param_3)

{
  ushort *puVar1;
  byte bVar2;
  char cVar3;

  cVar3 = -1;
  bVar2 = *(byte *)(param_1 + 0x2b);
  switch(bVar2) {
  case 9:
    cVar3 = objs0_mem[(short)param_3].morph_index;
    break;
  default:
    break;
  case 0xe:
    param_3 = 0x1a;
    break;
  case 0x12:
  case 0x13:
    param_3 = (ushort)*(byte *)(param_1 + 0x8f);
  }
  unit_set_object((short *)(param_1 + 0x33),param_2,param_3);
  if ((unit_type_array_scenery[bVar2].flags & 0x40) != 0) {
    *(undefined1 *)(param_1 + 0x3c) = 0;
  }
  puVar1 = (ushort *)(param_1 + 0x35);
  if ((unit_type_array_scenery[bVar2].flags & 0x80) == 0) {
    *puVar1 = *puVar1 & 0xff7f;
  }
  else {
    *(byte *)puVar1 = *(byte *)puVar1 | 0x80;
  }
  if ((unit_type_array_scenery[bVar2].flags & 0x10) != 0) {
    *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 0x80;
  }
  if ((unit_type_array_scenery[bVar2].flags & 0x20) != 0) {
    *(short *)(param_1 + 0x33) =
         ((*(short *)(param_1 + 0x3d) >> 6) + (*(short *)(param_1 + 0x3f) >> 6) & 3U) +
         unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_index;
  }
  if ((unit_type_array_scenery[bVar2].flags_1 & 5) != 0) {
    *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 2;
  }
  if (-1 < cVar3) {
    *(char *)(param_1 + 0x3b) = cVar3;
  }
  return;
}
