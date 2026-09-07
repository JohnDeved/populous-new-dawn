/* Ghidra 12.1.3 pseudocode; entry 0044a210; parameterize_by_screen_height.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int parameterize_by_screen_height(int param_1)

{
  int iVar1;

  iVar1 = (int)(screen_height / 2) + screen_height * param_1;
  return (int)(iVar1 + (iVar1 >> 0x1f & 0xffffU)) >> 0x10;
}
