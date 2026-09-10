/* Ghidra 12.1.3 pseudocode; entry 00424d30; FUN_00424d30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00424d30(int param_1)

{
  float fVar1;
  int *piVar2;
  int *piVar3;
  int iVar4;
  int *piVar5;
  undefined4 *puVar6;
  undefined4 *puVar7;
  undefined4 *puVar8;
  int local_10 [4];

  piVar5 = (int *)(param_1 + 0x6c);
  piVar2 = local_10;
  do {
    iVar4 = *piVar5;
    piVar5 = piVar5 + 1;
    piVar3 = piVar2 + 1;
    *piVar2 = (int)(temp_pnts_related_array + iVar4);
    piVar2 = piVar3;
  } while (piVar3 < &stack0x00000000);
  if (((*(float *)(local_10[0] + 0xc) != *(float *)(local_10[1] + 0xc)) ||
      (*(float *)(local_10[1] + 0xc) != *(float *)(local_10[2] + 0xc))) ||
     (*(float *)(local_10[3] + 0xc) != *(float *)(local_10[2] + 0xc))) {
    piVar2 = local_10;
    do {
      puVar7 = (undefined4 *)*piVar2;
      if (_DAT_0087cb5c < (float)puVar7[3]) {
        puVar6 = puVar7;
        puVar8 = &DAT_0087cb50;
        for (iVar4 = 8; iVar4 != 0; iVar4 = iVar4 + -1) {
          *puVar8 = *puVar6;
          puVar6 = puVar6 + 1;
          puVar8 = puVar8 + 1;
        }
        if ((float)(int)screen_width < _DAT_0087cb5c) {
          _DAT_0087cb5c = (float)(int)screen_width;
        }
      }
      if ((float)puVar7[3] < (float)facs0_struct_0087cb03._49_4_) {
        puVar6 = (undefined4 *)((int)&facs0_struct_0087cb03.point_4_v + 1);
        for (iVar4 = 8; iVar4 != 0; iVar4 = iVar4 + -1) {
          *puVar6 = *puVar7;
          puVar7 = puVar7 + 1;
          puVar6 = puVar6 + 1;
        }
        if (0x80000000 < (uint)facs0_struct_0087cb03._49_4_) {
          facs0_struct_0087cb03._49_4_ = 0;
        }
      }
      piVar2 = piVar2 + 1;
    } while (piVar2 < &stack0x00000000);
    fVar1 = (float)(int)screen_height;
    if ((float)(int)screen_height < (float)facs0_struct_0087cb03._53_4_) {
      facs0_struct_0087cb03._53_4_ = fVar1;
    }
    if (0x80000000 < (uint)facs0_struct_0087cb03._53_4_) {
      facs0_struct_0087cb03._53_4_ = 0;
    }
    if (fVar1 < DAT_0087cb60) {
      DAT_0087cb60 = fVar1;
    }
    if (0x80000000 < (uint)DAT_0087cb60) {
      DAT_0087cb60 = 0.0;
    }
  }
  return;
}
