/* Ghidra 12.1.3 pseudocode; entry 00517310; fill_sky_mem.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void fill_sky_mem(byte param_1,int param_2)

{
  uint uVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  uint uVar8;
  uint uVar9;
  uint uVar10;

  uVar1 = (1 << (param_1 & 0x1f)) - 1;
  iVar6 = 0;
  do {
    iVar7 = iVar6 + 8;
    iVar2 = (int)*(uint *)((int)&DAT_0058f910 + iVar6) >> (param_1 & 0x1f);
    uVar8 = *(uint *)((int)&DAT_0058f910 + iVar6) & uVar1;
    uVar9 = (uint)(*(int *)((int)&DAT_0058f914 + iVar6) * param_2) >> 8;
    uVar10 = uVar9 & uVar1;
    iVar3 = (int)uVar9 >> (param_1 & 0x1f);
    iVar4 = iVar3 * 0x60 + iVar2;
    iVar5 = sky_array[iVar4].x + ((int)((sky_array[iVar4 + 1].x - sky_array[iVar4].x) * uVar8) >> 3)
    ;
    iVar4 = ((int)((sky_array[iVar4 + 1].y - sky_array[iVar4].y) * uVar8) >> 3) + sky_array[iVar4].y
    ;
    iVar2 = (iVar3 + 1) * 0x60 + iVar2;
    *(int *)((int)&geom_2_ARRAY_00afc180[0].field0_0x0 + iVar6) =
         ((int)(((((int)((sky_array[iVar2 + 1].x - sky_array[iVar2].x) * uVar8) >> 3) - iVar5) +
                sky_array[iVar2].x) * uVar10) >> (param_1 & 0x1f)) + iVar5;
    *(int *)((int)&geom_2_ARRAY_00afc180[0].field1_0x4 + iVar6) =
         ((int)(((((int)((sky_array[iVar2 + 1].y - sky_array[iVar2].y) * uVar8) >> 3) - iVar4) +
                sky_array[iVar2].y) * uVar10) >> (param_1 & 0x1f)) + iVar4;
    iVar6 = iVar7;
  } while (iVar7 < 0xf8);
  return;
}
