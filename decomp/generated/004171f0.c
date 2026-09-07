/* Ghidra 12.1.3 pseudocode; entry 004171f0; get_vconfig_index.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int get_vconfig_index(uint param_1,int param_2)

{
  uint uVar1;
  uint uVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  vconfig_struct *pvVar7;
  int local_4;

  local_4 = 0xfffffff;
  iVar6 = 0;
  pvVar7 = vconfig_dat_mem;
  iVar3 = -1;
  do {
    uVar1 = (uint)(short)pvVar7->width;
    if ((param_1 == uVar1) && (iVar4 = iVar6, (short)pvVar7->height == param_2)) break;
    uVar2 = (int)(short)pvVar7->height >> 0x1f;
    iVar5 = ((((int)(short)pvVar7->height ^ uVar2) - uVar2) - param_2) *
            (((uVar1 ^ (int)uVar1 >> 0x1f) - ((int)uVar1 >> 0x1f)) - param_1);
    iVar4 = iVar3;
    if (iVar5 < local_4) {
      iVar4 = iVar6;
      local_4 = iVar5;
    }
    pvVar7 = pvVar7 + 5;
    iVar6 = iVar6 + 1;
    iVar3 = iVar4;
  } while (pvVar7 < &free_units_more_640);
  if (iVar4 < 0) {
    iVar4 = 0;
  }
  return iVar4;
}
