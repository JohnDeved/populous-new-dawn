/* Ghidra 12.1.3 pseudocode; entry 004f7dc0; FUN_004f7dc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f7dc0(int param_1,uint param_2,uint param_3,uint param_4,int param_5,undefined2 param_6,
                uint param_7)

{
  int iVar1;
  bool bVar2;
  bool bVar3;
  bool bVar4;
  int iVar5;
  int iVar6;
  bool bVar7;
  bool bVar8;
  bool bVar9;
  bool bVar10;
  bool bVar11;
  bool bVar12;
  bool bVar13;
  ushort local_34;
  byte local_32;
  byte bStack_31;
  byte local_30;
  byte bStack_2f;
  undefined2 local_2e;
  uint local_2c;
  undefined4 local_28;
  int local_1c;

  local_1c = 0;
  local_28 = 0x10000;
  bVar7 = (param_7 & 1) != 0;
  bVar8 = (param_7 & 2) == 0;
  bVar9 = (param_7 & 4) != 0;
  bVar10 = (param_7 & 8) == 0;
  bVar11 = (param_7 & 0x10) != 0;
  bVar12 = (param_7 & 0x20) == 0;
  bVar13 = (param_7 & 0x40) == 0;
  if (param_5 == 0) {
    local_2c = 0;
    do {
      if (((bVar12) ||
          ((((local_2c != 2 && (local_2c != 3)) && (local_2c != 4)) && (local_2c != 5)))) &&
         ((bVar10 || (local_2c != 5)))) {
        for (iVar1 = *(int *)(param_1 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
          if (((((((*(ushort *)(iVar1 + 0x76) & 0x7000) >> 0xc == local_2c) &&
                 ((bVar13 || (iVar5 = FUN_004f3200(iVar1), iVar5 == 0)))) &&
                ((*(byte *)(iVar1 + 0x11) & 8) == 0)) &&
               ((iVar5 = FUN_004f7720(iVar1), iVar5 == 0 &&
                ((bVar7 || ((*(ushort *)(iVar1 + 0x76) & 0x804) == 0)))))) &&
              ((param_2 == 0xffffffff ||
               ((param_2 == *(byte *)(iVar1 + 0x2b) || (param_3 == *(byte *)(iVar1 + 0x2b))))))) &&
             (((param_4 == 0xffffffff ||
               (((*(byte *)(iVar1 + 0xe) & 0x80) == 0 ||
                (local_28._0_2_ =
                      CONCAT11((char)((ushort)*(undefined2 *)(iVar1 + 0x3f) >> 8),
                               (char)((ushort)*(undefined2 *)(iVar1 + 0x3d) >> 8)),
                ((ushort)(&game_state.level_data[0].unit_index_2)
                         [(((ushort)local_28 & 0xfe) * 2 | (ushort)local_28 & 0xfe00) * 2] & 0x3ff)
                != param_4)))) &&
              ((*(char *)(iVar1 + 0x2b) != '\a' &&
               ((iVar5 = FUN_004f61f0(iVar1), iVar5 == 0 &&
                ((bVar9 || (iVar5 = FUN_004f62c0(iVar1,6), iVar5 == 0)))))))))) {
            iVar5 = FUN_004f25b0(iVar1);
            if ((bVar8) ||
               ((iVar6 = FUN_004f39d0(iVar1), iVar6 == 0 &&
                ((iVar6 = FUN_004f55d0(iVar1), iVar6 == 0 || (bVar11)))))) {
              bVar2 = false;
            }
            else {
              bVar2 = true;
            }
            if ((bVar9) && (iVar6 = FUN_004f62c0(iVar1,6), iVar6 != 0)) {
              bVar3 = true;
            }
            else {
              bVar3 = false;
            }
            if ((bVar7) && ((*(ushort *)(iVar1 + 0x76) & 0x804) != 0)) {
              bVar4 = true;
            }
            else {
              bVar4 = false;
            }
            iVar6 = FUN_004f6720(iVar1);
            if ((((iVar5 != 0) || (bVar2)) || (bVar3)) || ((bVar4 || (iVar6 != 0)))) {
              *(uint *)(iVar1 + 0x14) = *(uint *)(iVar1 + 0x14) & 0xfffffffe;
              return iVar1;
            }
          }
        }
      }
      local_2c = local_2c + 1;
      if (6 < (int)local_2c) {
        return 0;
      }
    } while( true );
  }
  if (param_5 != 1) {
    return 0;
  }
  local_2c = 0;
  do {
    if (((bVar12) || (((local_2c != 2 && (local_2c != 3)) && ((local_2c != 4 && (local_2c != 5))))))
       && ((bVar10 || (local_2c != 5)))) {
      for (iVar1 = *(int *)(param_1 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
        if (((((((*(ushort *)(iVar1 + 0x76) & 0x7000) >> 0xc == local_2c) &&
               (((bVar13 || (iVar5 = FUN_004f3200(iVar1), iVar5 == 0)) &&
                ((*(byte *)(iVar1 + 0x11) & 8) == 0)))) && (iVar5 = FUN_004f7720(iVar1), iVar5 == 0)
              ) && (((bVar7 || ((*(ushort *)(iVar1 + 0x76) & 0x804) == 0)) &&
                    ((param_2 == 0xffffffff ||
                     ((param_2 == *(byte *)(iVar1 + 0x2b) || (param_3 == *(byte *)(iVar1 + 0x2b)))))
                    )))) &&
            ((param_4 == 0xffffffff ||
             (((*(byte *)(iVar1 + 0xe) & 0x80) == 0 ||
              (local_2e = CONCAT11((char)((ushort)*(undefined2 *)(iVar1 + 0x3f) >> 8),
                                   (char)((ushort)*(undefined2 *)(iVar1 + 0x3d) >> 8)),
              ((ushort)(&game_state.level_data[0].unit_index_2)
                       [((local_2e & 0xfe) * 2 | local_2e & 0xfe00) * 2] & 0x3ff) != param_4))))))
           && (((*(char *)(iVar1 + 0x2b) != '\a' && (iVar5 = FUN_004f61f0(iVar1), iVar5 == 0)) &&
               ((bVar9 || (iVar5 = FUN_004f62c0(iVar1,6), iVar5 == 0)))))) {
          iVar5 = FUN_004f25b0(iVar1);
          if ((bVar8) ||
             ((iVar6 = FUN_004f39d0(iVar1), iVar6 == 0 &&
              ((iVar6 = FUN_004f55d0(iVar1), iVar6 == 0 || (bVar11)))))) {
            bVar2 = false;
          }
          else {
            bVar2 = true;
          }
          if (bVar9) {
            bVar3 = true;
            iVar6 = FUN_004f62c0(iVar1,6);
            if (iVar6 == 0) goto LAB_004f8264;
          }
          else {
LAB_004f8264:
            bVar3 = false;
          }
          if ((bVar7) && ((*(ushort *)(iVar1 + 0x76) & 0x804) != 0)) {
            bVar4 = true;
          }
          else {
            bVar4 = false;
          }
          iVar6 = FUN_004f6720(iVar1);
          if ((((iVar5 != 0) || (bVar2)) || (bVar3)) || ((bVar4 || (iVar6 != 0)))) {
            local_34 = CONCAT11((char)((ushort)*(undefined2 *)(iVar1 + 0x3f) >> 8),
                                (char)((ushort)*(undefined2 *)(iVar1 + 0x3d) >> 8)) & 0xfefe;
            local_30 = (byte)param_6;
            local_32 = (byte)local_34;
            iVar5 = (uint)local_32 - (uint)local_30;
            if (iVar5 < 0) {
              iVar5 = (uint)local_30 - (uint)local_32;
            }
            if (0x80 < iVar5) {
              iVar5 = 0x100 - iVar5;
            }
            bStack_31 = (byte)(local_34 >> 8);
            bStack_2f = (byte)((ushort)param_6 >> 8);
            iVar6 = (uint)bStack_31 - (uint)bStack_2f;
            if (iVar6 < 0) {
              iVar6 = (uint)bStack_2f - (uint)bStack_31;
            }
            if (0x80 < iVar6) {
              iVar6 = 0x100 - iVar6;
            }
            if ((iVar5 < 0x13) && (iVar6 < 0x13)) {
              *(uint *)(iVar1 + 0x14) = *(uint *)(iVar1 + 0x14) & 0xfffffffe;
              return iVar1;
            }
            if (iVar5 + iVar6 < local_28) {
              local_28 = iVar5 + iVar6;
              local_1c = iVar1;
            }
          }
        }
      }
    }
    local_2c = local_2c + 1;
    if (6 < (int)local_2c) {
      if (local_1c != 0) {
        *(uint *)(local_1c + 0x14) = *(uint *)(local_1c + 0x14) & 0xfffffffe;
      }
      return local_1c;
    }
  } while( true );
}
