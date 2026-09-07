/* Ghidra 12.1.3 pseudocode; entry 004a32d0; reset_palette_mem.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void reset_palette_mem(int param_1,char param_2)

{
  *(undefined1 *)(param_1 + 0x3fc) = 0;
  *(undefined1 *)(param_1 + 0x3fd) = 0;
  *(undefined1 *)(param_1 + 0x3fe) = 0;
  *(undefined1 *)(param_1 + 0x3f8) = 0;
  *(undefined1 *)(param_1 + 0x3f9) = 0;
  *(undefined1 *)(param_1 + 0x3fa) = 0;
  if (param_2 != '\0') {
    *(undefined1 *)(param_1 + 0x3fc) = 0xff;
    *(undefined1 *)(param_1 + 0x3fd) = 0xff;
    *(undefined1 *)(param_1 + 0x3fe) = 0xff;
    *(undefined1 *)(param_1 + 0x3f8) = 0x83;
    *(undefined1 *)(param_1 + 0x3f9) = 0x83;
    *(undefined1 *)(param_1 + 0x3fa) = 0x83;
  }
  return;
}
