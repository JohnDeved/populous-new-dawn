/* Ghidra 12.1.3 pseudocode; entry 005171d0; init_texture_mem_struct_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

int init_texture_mem_struct_1(void)

{
  int iVar1;

  if (((is_init_required_for_texture_mem_struct != 0) &&
      (iVar1 = init_texture_mem_struct(), iVar1 != -0x7789fe3e)) && (iVar1 < 0)) {
    return iVar1;
  }
  return 0;
}
