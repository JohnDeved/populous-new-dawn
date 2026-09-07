/* Ghidra 12.1.3 pseudocode; entry 004f8490; FUN_004f8490.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f8490(int param_1,uint param_2,uint param_3,uint param_4,int param_5,undefined4 param_6,
                 uint param_7,int param_8,undefined4 *param_9)

{
  bool bVar1;
  bool bVar2;
  bool bVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  undefined4 *puVar8;
  bool bVar9;
  bool bVar10;
  undefined2 local_32;
  uint local_30;

  iVar7 = 0;
  if (param_8 < 0) {
    param_8 = 0;
  }
  else if (100 < param_8) {
    param_8 = 100;
  }
  bVar9 = (param_7 & 1) != 0;
  bVar10 = (param_7 & 4) != 0;
  puVar8 = param_9;
  for (iVar6 = 100; iVar6 != 0; iVar6 = iVar6 + -1) {
    *puVar8 = 0xffffffff;
    puVar8 = puVar8 + 1;
  }
  local_30 = 0;
  do {
    if ((((param_7 & 0x20) == 0) ||
        ((((local_30 != 2 && (local_30 != 3)) && (local_30 != 4)) && (local_30 != 5)))) &&
       (((param_7 & 8) == 0 || (local_30 != 5)))) {
      for (iVar6 = *(int *)(param_1 + 0x881); iVar6 != 0; iVar6 = *(int *)(iVar6 + 8)) {
        if (((((*(ushort *)(iVar6 + 0x76) & 0x7000) >> 0xc == local_30) &&
             (((param_7 & 0x40) == 0 || (iVar4 = FUN_004f3200(iVar6), iVar4 == 0)))) &&
            (((*(byte *)(iVar6 + 0x11) & 8) == 0 &&
             ((iVar4 = FUN_004f7720(iVar6), iVar4 == 0 &&
              ((bVar9 || ((*(ushort *)(iVar6 + 0x76) & 0x804) == 0)))))))) &&
           (((param_2 == 0xffffffff ||
             ((*(byte *)(iVar6 + 0x2b) == param_2 || (param_3 == *(byte *)(iVar6 + 0x2b))))) &&
            ((((param_4 == 0xffffffff ||
               (((*(byte *)(iVar6 + 0xe) & 0x80) == 0 ||
                (local_32 = CONCAT11((char)((ushort)*(undefined2 *)(iVar6 + 0x3f) >> 8),
                                     (char)((ushort)*(undefined2 *)(iVar6 + 0x3d) >> 8)),
                ((ushort)(&game_state.level_data[0].unit_index_2)
                         [((local_32 & 0xfe) * 2 | local_32 & 0xfe00) * 2] & 0x3ff) != param_4))))
              && (*(char *)(iVar6 + 0x2b) != '\a')) &&
             ((iVar4 = FUN_004f61f0(iVar6), iVar4 == 0 &&
              ((bVar10 || (iVar4 = FUN_004f62c0(iVar6,6), iVar4 == 0)))))))))) {
          iVar4 = FUN_004f25b0(iVar6);
          if (((param_7 & 2) == 0) ||
             ((iVar5 = FUN_004f39d0(iVar6), iVar5 == 0 &&
              ((iVar5 = FUN_004f55d0(iVar6), iVar5 == 0 || ((param_7 & 0x10) != 0)))))) {
            bVar1 = false;
          }
          else {
            bVar1 = true;
          }
          if ((bVar10) && (iVar5 = FUN_004f62c0(iVar6,6), iVar5 != 0)) {
            bVar2 = true;
          }
          else {
            bVar2 = false;
          }
          if ((bVar9) && ((*(ushort *)(iVar6 + 0x76) & 0x804) != 0)) {
            bVar3 = true;
          }
          else {
            bVar3 = false;
          }
          iVar5 = FUN_004f6720(iVar6);
          if ((((iVar4 != 0) || (bVar1)) || (bVar2)) || ((bVar3 || (iVar5 != 0)))) {
            if (param_5 == 0) {
              *(undefined2 *)((int)param_9 + iVar7 * 4 + 2) = *(undefined2 *)(iVar6 + 0x24);
            }
            else if ((param_5 != 1) ||
                    (iVar4 = FUN_004f8390(iVar6,param_6,param_9,param_8,iVar7), iVar4 == 0))
            goto LAB_004f8796;
            iVar7 = iVar7 + 1;
          }
        }
LAB_004f8796:
      }
    }
    local_30 = local_30 + 1;
    if (6 < (int)local_30) {
      if (iVar7 <= param_8) {
        param_8 = iVar7;
      }
      if (0 < param_8) {
        do {
          unit_land_array[*(ushort *)((int)param_9 + 2)]->flags_3 =
               unit_land_array[*(ushort *)((int)param_9 + 2)]->flags_3 & 0xfffffffe;
          param_8 = param_8 + -1;
          param_9 = param_9 + 1;
        } while (param_8 != 0);
      }
      return;
    }
  } while( true );
}
