/* Ghidra 12.1.3 pseudocode; entry 004a7b60; FUN_004a7b60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a7b60(int param_1,char param_2,short param_3)

{
  if (*(char *)(param_1 + 0x2a) == '\x05') {
    if (*(char *)(param_1 + 0x2b) == '\n') {
      *(byte *)(param_1 + 0x90) = *(byte *)(param_1 + 0x90) | 4;
      *(short *)(param_1 + 0x7c) = param_3;
    }
    else {
      if (((*(byte *)(param_1 + 0x90) & 4) == 0) && ((*(byte *)(param_1 + 0xe) & 0x10) == 0)) {
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = 5;
        init_unit_class(param_1);
      }
      if (0 < param_3) {
        *(short *)(param_1 + 0x7c) = param_3;
      }
      if (param_2 != '\0') {
        *(byte *)(param_1 + 0x90) = *(byte *)(param_1 + 0x90) | 2;
        return;
      }
    }
  }
  return;
}
