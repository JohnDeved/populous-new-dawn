/* Ghidra 12.1.3 pseudocode; entry 004a2920; set_pal0_mem_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_pal0_mem_2(void)

{
  int iVar1;
  undefined4 *puVar2;
  undefined4 *puVar3;

  pal0_mem_2_size = 0x10;
  puVar2 = pal0_mem + 0x70;
  puVar3 = pal0_mem_2;
  for (iVar1 = 0x10; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = *puVar2;
    puVar2 = puVar2 + 1;
    puVar3 = puVar3 + 1;
  }
  return;
}
