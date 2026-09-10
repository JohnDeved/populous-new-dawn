/* Ghidra 12.1.3 pseudocode; entry 00424900; FUN_00424900.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00424900(void)

{
  bool bVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  short *psVar5;
  short *psVar6;
  short sVar7;
  short local_10 [8];

  bVar1 = false;
  psVar6 = (short *)&temp_struct_57b_ARRAY_00659730[0].field_0xe;
  iVar3 = INT_006513e8;
  if (0 < INT_006513e8) {
    do {
      iVar2 = 0;
      iVar4 = 0;
      psVar5 = psVar6;
      do {
        if (*psVar5 == 0) break;
        iVar4 = iVar4 + 1;
        psVar5 = psVar5 + 1;
        iVar2 = iVar2 + 1;
      } while (iVar2 < 7);
      iVar2 = 0;
      if (0 < iVar4 + -2) {
        psVar5 = local_10;
        do {
          if (bVar1) goto switchD_00424990_caseD_5;
          sVar7 = -1;
          if (temp_4_2B_size_1 < 0x15df) {
            sVar7 = (short)temp_4_2B_size_1;
            temp_4_2B_size_1 = temp_4_2B_size_1 + 1;
          }
          *psVar5 = sVar7;
          if (sVar7 < 0) {
            bVar1 = true;
          }
          psVar5 = psVar5 + 1;
          iVar2 = iVar2 + 1;
        } while (iVar2 < iVar4 + -2);
      }
      if (!bVar1) {
        switch(iVar4) {
        case 7:
          iVar2 = (int)local_10[3];
          (&temp_4_2B_ARRAY_006513f0[0].a)[iVar2 * 3] = *psVar6;
          (&temp_4_2B_ARRAY_006513f0[0].b)[iVar2 * 3] = psVar6[5];
          (&temp_4_2B_ARRAY_006513f0[0].c)[iVar2 * 3] = psVar6[6];
        case 6:
          iVar2 = (int)local_10[3];
          (&temp_4_2B_ARRAY_006513f0[0].a)[iVar2 * 3] = *psVar6;
          (&temp_4_2B_ARRAY_006513f0[0].b)[iVar2 * 3] = psVar6[4];
          (&temp_4_2B_ARRAY_006513f0[0].c)[iVar2 * 3] = psVar6[5];
        case 5:
          iVar2 = (int)local_10[2];
          (&temp_4_2B_ARRAY_006513f0[0].a)[iVar2 * 3] = *psVar6;
          (&temp_4_2B_ARRAY_006513f0[0].b)[iVar2 * 3] = psVar6[3];
          (&temp_4_2B_ARRAY_006513f0[0].c)[iVar2 * 3] = psVar6[4];
        case 4:
          iVar2 = (int)local_10[1];
          (&temp_4_2B_ARRAY_006513f0[0].a)[iVar2 * 3] = *psVar6;
          (&temp_4_2B_ARRAY_006513f0[0].b)[iVar2 * 3] = psVar6[2];
          (&temp_4_2B_ARRAY_006513f0[0].c)[iVar2 * 3] = psVar6[3];
        case 3:
          iVar2 = (int)local_10[0];
          (&temp_4_2B_ARRAY_006513f0[0].a)[iVar2 * 3] = *psVar6;
          (&temp_4_2B_ARRAY_006513f0[0].b)[iVar2 * 3] = psVar6[1];
          (&temp_4_2B_ARRAY_006513f0[0].c)[iVar2 * 3] = psVar6[2];
        }
      }
switchD_00424990_caseD_5:
      psVar6 = psVar6 + 7;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
  }
  return;
}
