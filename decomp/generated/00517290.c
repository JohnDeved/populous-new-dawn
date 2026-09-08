/* Ghidra 12.1.3 pseudocode; entry 00517290; clear_sky_mem_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void clear_sky_mem_1(void)

{
  undefined4 uVar1;
  undefined4 *puVar2;
  undefined4 *puVar3;

  puVar2 = &sky_mem_start_1;
  do {
    puVar3 = puVar2 + 2;
    uVar1 = __ftol();
    *puVar2 = uVar1;
    uVar1 = __ftol();
    puVar2[1] = uVar1;
    puVar2 = puVar3;
  } while (puVar3 < &sky_mem_end_1);
  return;
}
