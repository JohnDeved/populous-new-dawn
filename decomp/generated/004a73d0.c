/* Ghidra 12.1.3 pseudocode; entry 004a73d0; FUN_004a73d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a73d0(int param_1)

{
  char cVar1;
  short sVar2;

  if ((*(byte *)(param_1 + 0x11) & 4) == 0) {
    if ((*(byte *)(param_1 + 0xc) & 4) != 0) {
      *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + -0x50;
      sVar2 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
      if (*(short *)(param_1 + 0x41) <= sVar2) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffb;
        *(short *)(param_1 + 0x41) = sVar2;
      }
    }
    if ((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].field14_0x16 & 0x80) == 0) {
      cVar1 = FUN_0044f980(param_1 + 0x3d);
      if ((cVar1 == '\0') && ((*(byte *)(param_1 + 0xe) & 0x10) == 0)) {
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = 2;
        init_unit_class(param_1);
      }
    }
  }
  else {
    if (*(short *)(param_1 + 0x91) != 0) {
      cVar1 = FUN_004a8220(param_1,*(short *)(param_1 + 0x91));
      if (cVar1 == '\0') {
        *(undefined2 *)(param_1 + 0x91) = 0;
      }
    }
    FUN_004e6d00(param_1);
    if (((*(byte *)(param_1 + 0x11) & 4) == 0) &&
       (*(undefined1 *)(param_1 + 0x2d) = 0,
       (unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].field14_0x16 & 0x80) == 0)) {
      cVar1 = FUN_0044f980(param_1 + 0x3d);
      if ((cVar1 == '\0') && ((*(byte *)(param_1 + 0xe) & 0x10) == 0)) {
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = 2;
        init_unit_class(param_1);
        return;
      }
    }
  }
  return;
}
