/* Ghidra 12.1.3 pseudocode; entry 00408cb0; FUN_00408cb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00408cb0(int param_1,char param_2)

{
  if (((unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x4a & 1) == 0) &&
     (*(char *)(param_1 + 0x2c) != '\x04')) {
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 4;
      init_unit_class(param_1);
    }
    if (param_2 != -1) {
      *(char *)(param_1 + 0xaf) = param_2;
    }
  }
  return;
}
