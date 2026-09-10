/* Ghidra 12.1.3 pseudocode; entry 00423e80; FUN_00423e80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00423e80(undefined4 param_1,ushort *param_2,undefined1 param_3,undefined4 param_4)

{
  short sVar1;
  short sVar2;
  bool bVar3;
  bool bVar4;
  short sVar5;
  short *psVar6;
  short sVar7;
  short *psVar8;
  int iVar9;
  int local_34;
  int local_30;
  int local_28 [8];
  short *local_8;
  int *local_4;

  local_34 = 0;
  sVar5 = alloc_pnts_related_item(param_2,0,param_4);
  if (sVar5 == 0) {
    return;
  }
  bVar3 = false;
  bVar4 = false;
  if (((char)*param_2 == '\0') && ((char)param_2[1] == '\0')) {
    if (((*param_2 & 0x1ff) == 0) && ((param_2[1] & 0x1ff) == 0)) {
      bVar3 = true;
    }
    else if ((((int)(short)*param_2 + 0x100U & 0x1ff) == 0) &&
            (((int)(short)param_2[1] + 0x100U & 0x1ff) == 0)) {
      bVar4 = true;
    }
  }
  if (bVar3) {
    if (!bVar4) {
      local_34 = 8;
      goto switchD_00423fc4_caseD_5;
    }
  }
  else if (!bVar4) {
    switch(param_3) {
    case 0:
      local_34 = 1;
      break;
    case 1:
      local_34 = 2;
      break;
    case 2:
      local_34 = 2;
      break;
    case 3:
    case 4:
      local_34 = 2;
    }
    goto switchD_00423fc4_caseD_5;
  }
  local_34 = 4;
switchD_00423fc4_caseD_5:
  if (local_34 != 0) {
    local_4 = local_28;
    local_30 = local_34;
    do {
      if (-1 < *local_4) {
        psVar8 = &temp_4_2B_ARRAY_006513f0[0].a + *local_4 * 3;
        if (*psVar8 < 0) {
          sVar7 = -*psVar8;
        }
        else {
          sVar7 = 0;
          if (INT_006513e8 < 399) {
            INT_006513e8 = INT_006513e8 + 1;
            sVar7 = (short)INT_006513e8;
          }
          if (sVar7 == 0) goto LAB_004242ec;
          local_34 = 3;
          local_8 = psVar8;
          do {
            sVar1 = *local_8;
            if (sVar1 != 0) {
              iVar9 = 0;
              psVar6 = (short *)(&temp_struct_57b_ARRAY_00659730[0].field_0x0 + sVar7 * 0xe);
              while (sVar2 = *psVar6, sVar2 != 0) {
                if ((sVar1 == sVar2) ||
                   ((temp_pnts_related_array[sVar2].x == temp_pnts_related_array[sVar1].x &&
                    (temp_pnts_related_array[sVar2].z == temp_pnts_related_array[sVar1].z))))
                goto LAB_0042426b;
                iVar9 = iVar9 + 1;
                psVar6 = psVar6 + 1;
                if (6 < iVar9) goto LAB_0042426b;
              }
              *psVar6 = sVar1;
            }
LAB_0042426b:
            local_8 = local_8 + 1;
            local_34 = local_34 + -1;
          } while (local_34 != 0);
          *psVar8 = -sVar7;
        }
        if (sVar7 != 0) {
          iVar9 = 0;
          psVar8 = (short *)(&temp_struct_57b_ARRAY_00659730[0].field_0x0 + sVar7 * 0xe);
          while (sVar7 = *psVar8, sVar7 != 0) {
            if ((sVar5 == sVar7) ||
               ((temp_pnts_related_array[sVar7].x == temp_pnts_related_array[sVar5].x &&
                (temp_pnts_related_array[sVar7].z == temp_pnts_related_array[sVar5].z))))
            goto LAB_004242ec;
            iVar9 = iVar9 + 1;
            psVar8 = psVar8 + 1;
            if (6 < iVar9) goto LAB_004242ec;
          }
          *psVar8 = sVar5;
        }
      }
LAB_004242ec:
      local_4 = local_4 + 1;
      local_30 = local_30 + -1;
    } while (local_30 != 0);
  }
  return;
}
