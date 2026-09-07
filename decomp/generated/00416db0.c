/* Ghidra 12.1.3 pseudocode; entry 00416db0; init_vconfig_struct_array.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_vconfig_struct_array(void)

{
  int iVar1;
  int iVar2;
  vconfig_struct *pvVar3;
  vconfig_struct *pvVar4;

  iVar2 = 10;
  pvVar3 = vconfig_dat_mem;
  do {
    iVar1 = 0;
    pvVar4 = pvVar3;
    do {
      pvVar3 = pvVar4 + 1;
      init_vconfig_struct(pvVar4,iVar1);
      iVar1 = iVar1 + 1;
      pvVar4 = pvVar3;
    } while (iVar1 < 5);
    iVar2 = iVar2 + -1;
  } while (iVar2 != 0);
  return;
}
