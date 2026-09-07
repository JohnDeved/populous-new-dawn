/* Ghidra 12.1.3 pseudocode; entry 004a3420; copy_palette_to_global.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void copy_palette_to_global(undefined4 *param_1)

{
  int iVar1;
  undefined4 *puVar2;
  undefined4 *puVar3;

  puVar2 = param_1;
  puVar3 = palette_global_1;
  for (iVar1 = 0x100; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = *puVar2;
    puVar2 = puVar2 + 1;
    puVar3 = puVar3 + 1;
  }
  palette_global_ptr = param_1;
  return;
}
