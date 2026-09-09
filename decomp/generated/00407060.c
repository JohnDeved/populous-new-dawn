/* Ghidra 12.1.3 pseudocode; entry 00407060; FUN_00407060.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00407060(int param_1)

{
  char cVar1;
  short sVar2;

  cVar1 = *(char *)(param_1 + 0xa7);
  if (*(short *)(param_1 + 0x33) == 0x9b) {
    if (cVar1 == '\0') {
      if ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0) {
        FUN_0048a050(param_1,0x9f,0);
      }
      sVar2 = *(short *)(param_1 + 0x41) + -6;
      *(short *)(param_1 + 0x41) = sVar2;
      if (sVar2 < -799) {
        FUN_00503230();
        if ((*(byte *)(param_1 + 0x14) & 0x40) == 0) {
          FUN_00403860(param_1);
          if (*(char *)(param_1 + 0xaf) != -1) {
            FUN_0041b550(*(char *)(param_1 + 0xaf),4,1);
          }
        }
        update_after_unit_alloc(param_1);
        return;
      }
    }
    else {
      *(char *)(param_1 + 0xa7) = cVar1 + -1;
      if ((char)(cVar1 + -1) < '\x01') {
        *(undefined1 *)(param_1 + 0xa7) = 0;
        *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x400000;
        DAT_0089ce61 = 2;
        FUN_0040baf0(param_1,1);
        return;
      }
    }
  }
  else {
    *(char *)(param_1 + 0xa7) = cVar1 + -1;
    if ((char)(cVar1 + -1) < '\x01') {
      *(undefined1 *)(param_1 + 0xa7) = 0x40;
      unit_set_object((short *)(param_1 + 0x33),
                      unit_type_array_building[*(byte *)(param_1 + 0x2b)].some_index,0x9b);
    }
  }
  return;
}
