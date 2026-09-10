/* Ghidra 12.1.3 pseudocode; entry 0051c110; FUN_0051c110.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_0051c110(int param_1,byte *param_2,short *param_3)

{
  undefined2 uVar1;
  unit_struct *puVar2;
  bool bVar3;
  int iVar4;
  char cVar5;
  char cVar6;
  byte bVar7;
  int iVar8;
  int iVar9;
  unit_struct *puVar10;
  char local_f;
  ushort local_e;
  char cStack_a;
  char cStack_9;
  byte bStack_8;
  byte bStack_7;
  undefined2 uStack_6;
  undefined1 local_4 [4];

  bVar3 = false;
  local_f = '\x01';
  if (((&DAT_005a7dcb)[(uint)*param_2 * 0x16] & 8) == 0) {
    puVar10 = (unit_struct *)0x0;
    if (((*(ushort *)(param_2 + 6) != 0) &&
        (puVar2 = unit_land_array[*(ushort *)(param_2 + 6)], (*(byte *)&puVar2->flags_2 & 1) == 0))
       && (puVar2->unit_class != '\0')) {
      puVar10 = puVar2;
    }
    if (puVar10 == (unit_struct *)0x0) {
      *(undefined4 *)param_3 = *(undefined4 *)(param_1 + 0x3d);
    }
    else {
      iVar9 = get_adjacent_unit(puVar10,0);
      if (iVar9 == 0) {
        uVar1 = (puVar10->pos).y;
        param_3[0] = (puVar10->pos).x;
        param_3[1] = uVar1;
      }
      else {
        local_f = '\x02';
        FUN_004044b0(iVar9,param_3);
      }
    }
  }
  else {
    bStack_8 = (byte)*(undefined2 *)(param_2 + 6);
    bStack_7 = (byte)((ushort)*(undefined2 *)(param_2 + 6) >> 8);
    *param_3 = ((bStack_8 & 0xfe) + 1) * 0x100;
    param_3[1] = ((bStack_7 & 0xfe) + 1) * 0x100;
    cStack_a = (char)*(undefined2 *)(param_2 + 6);
    cStack_9 = (char)((ushort)*(undefined2 *)(param_2 + 6) >> 8);
    cStack_a = cStack_a - param_2[8];
    iVar9 = param_2[8] + 1;
    bStack_8 = (byte)iVar9;
    bStack_7 = (byte)((uint)iVar9 >> 8);
    uStack_6 = 0;
    cStack_9 = cStack_9 - param_2[9];
    cVar5 = cStack_9;
    for (iVar8 = param_2[9] + 1; iVar8 != 0; iVar8 = iVar8 + -1) {
      cVar6 = cStack_a;
      iVar4 = iVar9;
      if (bVar3) goto LAB_0051c20c;
      while ((iVar4 != 0 && (!bVar3))) {
        if ((*(byte *)((int)&game_state.level_data[0].flags +
                      ((CONCAT11(cVar5,cVar6) & 0xfe) * 2 | CONCAT11(cVar5,cVar6) & 0xfe00) * 4 + 1)
            & 2) == 0) {
          bVar3 = true;
        }
        cVar6 = cVar6 + '\x02';
        iVar4 = iVar4 + -1;
      }
      cVar5 = cVar5 + '\x02';
    }
    if (bVar3) {
LAB_0051c20c:
      uVar1 = *(undefined2 *)(param_2 + 6);
      cStack_a = (char)uVar1;
      cStack_9 = (char)((ushort)uVar1 >> 8);
      game_state._755280_4_ = param_1;
      game_state._755258_2_ = SUB42(land_const_1,0);
      iVar9 = FUN_00518070(CONCAT13(bStack_7,CONCAT12(bStack_8,uVar1)));
      if ((iVar9 != 0) && (cVar5 = get_empty_indexed_xy(2,0,0,0x10), cVar5 != '\0')) {
        local_f = '\0';
        do {
          cVar6 = get_indexed_xy(cVar5,&bStack_8,local_4);
          if (cVar6 == '\0') break;
          bVar7 = bStack_8 * '\x02' + cStack_a;
          cVar6 = local_4[0] * '\x02' + cStack_9;
          iVar9 = FUN_00518070(CONCAT13(cStack_9,CONCAT12(cStack_a,CONCAT11(cVar6,bVar7))));
          if (iVar9 == 0) {
            local_f = '\x01';
            local_e = CONCAT11(cVar6,bVar7) & 0xfefe;
            *param_3 = ((bVar7 & 0xfe) + 1) * 0x100;
            param_3[1] = ((local_e >> 8) + 1) * 0x100;
          }
        } while (local_f == '\0');
        clear_indexed_xy(cVar5);
      }
    }
    else {
      local_f = '\x02';
      FUN_004044b0(unit_land_array
                   [(ushort)(&game_state.level_data[0].unit_index_2)
                            [((CONCAT11(cStack_9,cStack_a) & 0xfe) * 2 |
                             CONCAT11(cStack_9,cStack_a) & 0xfe00) * 2] & 0x3ff],param_3);
    }
  }
  return local_f;
}
