/* Ghidra 12.1.3 pseudocode; entry 00423390; FUN_00423390.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00423390(int param_1)

{
  byte bVar1;
  byte bVar2;
  char cVar3;
  short sVar4;
  int iVar5;
  int iVar6;
  short sVar7;
  int iVar8;
  byte local_22;
  byte bStack_21;
  undefined4 local_20;
  short local_1c;
  short local_1a;
  int local_18;
  int local_14;
  int local_10;
  int local_c;
  int local_8;
  int local_4;

  comp_distances(param_1 + 0x30,param_1);
  local_20._0_1_ = (byte)((ushort)*(undefined2 *)(param_1 + 0x40) >> 8) & 0xfe;
  bVar1 = (byte)local_20;
  local_20._1_1_ = (byte)((ushort)*(undefined2 *)(param_1 + 0x42) >> 8) & 0xfe;
  bVar2 = local_20._1_1_;
  bStack_21 = local_20._1_1_;
  local_20._0_2_ =
       CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x4a) >> 8),
                (char)((ushort)*(undefined2 *)(param_1 + 0x48) >> 8)) & 0xfefe;
  iVar5 = (uint)(byte)(ushort)local_20 - (uint)bVar1;
  if (iVar5 < 0) {
    iVar5 = (uint)bVar1 - (uint)(byte)(ushort)local_20;
  }
  if (0x80 < iVar5) {
    iVar5 = 0x100 - iVar5;
  }
  local_18 = iVar5 / 2 + 1;
  iVar5 = (uint)local_20._1_1_ - (uint)bVar2;
  if (iVar5 < 0) {
    iVar5 = (uint)bVar2 - (uint)local_20._1_1_;
  }
  if (0x80 < iVar5) {
    iVar5 = 0x100 - iVar5;
  }
  local_4 = iVar5 / 2 + 1;
  *(int *)(param_1 + 0x5c) = local_18;
  *(int *)(param_1 + 0x60) = local_4;
  DAT_006513e0 = local_4 * local_18 * 4;
  if (0 < local_4) {
    local_8 = 0;
    local_10 = (-1 - local_18) * 4;
    local_c = local_18 * 4;
    do {
      local_22 = bVar1;
      if (0 < local_18) {
        local_20 = local_18;
        iVar5 = local_10;
        iVar8 = local_8;
        do {
          local_14 = 0;
          do {
            local_1c = (ushort)local_22 * 0x100;
            local_1a = (ushort)bStack_21 * 0x100;
            if (local_14 == 0) {
              iVar6 = 1;
            }
            else {
              iVar6 = 2;
              local_1c = local_1c + 0x100;
              local_1a = local_1a + 0x100;
            }
            cVar3 = is_point_in_polygon(&local_1c,param_1,*(undefined4 *)(param_1 + 0x50));
            if ((cVar3 != '\0') && (sVar4 = alloc_pnts_related_item(&local_1c,iVar6,0), sVar4 != 0))
            {
              sVar7 = (short)iVar8;
              if (iVar6 == 1) {
                iVar6 = iVar5 + 4;
                FUN_004236d0((short)iVar5 + 1,sVar4,1);
                FUN_004236d0((short)iVar5 + 2,sVar4,1);
                FUN_004236d0(iVar6,sVar4,1);
                FUN_004236d0(CONCAT22((short)((uint)iVar6 >> 0x10),(short)iVar6 + 1),sVar4,0);
                FUN_004236d0(sVar7 + -2,sVar4,2);
                if (-1 < (short)(sVar7 + -1)) {
                  (&temp_4_2B_ARRAY_006513f0[0].c)[(short)(sVar7 + -1) * 3] = sVar4;
                }
                if (-1 < sVar7) {
                  (&temp_4_2B_ARRAY_006513f0[0].a)[sVar7 * 3] = sVar4;
                }
                if (-1 < (short)(sVar7 + 3)) {
                  (&temp_4_2B_ARRAY_006513f0[0].a)[(short)(sVar7 + 3) * 3] = sVar4;
                }
              }
              else if (iVar6 == 2) {
                if (-1 < sVar7) {
                  (&temp_4_2B_ARRAY_006513f0[0].c)[sVar7 * 3] = sVar4;
                }
                if (-1 < (short)(sVar7 + 1)) {
                  (&temp_4_2B_ARRAY_006513f0[0].c)[(short)(sVar7 + 1) * 3] = sVar4;
                }
                if (-1 < (short)(sVar7 + 2)) {
                  (&temp_4_2B_ARRAY_006513f0[0].a)[(short)(sVar7 + 2) * 3] = sVar4;
                }
                if (-1 < (short)(sVar7 + 3)) {
                  (&temp_4_2B_ARRAY_006513f0[0].b)[(short)(sVar7 + 3) * 3] = sVar4;
                }
              }
            }
            local_14 = local_14 + 1;
          } while (local_14 < 2);
          iVar8 = iVar8 + 4;
          iVar5 = iVar5 + 4;
          local_22 = local_22 + 2;
          local_20 = local_20 + -1;
        } while (local_20 != 0);
      }
      local_10 = local_10 + local_c;
      local_8 = local_8 + local_c;
      bStack_21 = bStack_21 + 2;
      local_4 = local_4 + -1;
    } while (local_4 != 0);
  }
  return;
}
