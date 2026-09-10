/* Ghidra 12.1.3 pseudocode; entry 00401b10; FUN_00401b10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00401b10(int param_1,undefined1 param_2)

{
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = param_2;
    init_unit_class(param_1);
  }
  return;
}
