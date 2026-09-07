/* Ghidra 12.1.3 pseudocode; entry 0040cc30; set_unit_anim.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_unit_anim(int param_1,undefined2 param_2,undefined2 param_3,undefined1 param_4)

{
  *(undefined2 *)(param_1 + 0x74) = param_2;
  *(undefined2 *)(param_1 + 0x72) = 0;
  *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 0x10;
  *(undefined2 *)(param_1 + 0x76) = param_3;
  *(undefined1 *)(param_1 + 0x71) = param_4;
  return;
}
