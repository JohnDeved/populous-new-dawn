/* Ghidra 12.1.3 pseudocode; entry 0043c340; FUN_0043c340.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_0043c340(int param_1,unit_struct *param_2,undefined4 *param_3,uint *param_4)

{
  undefined4 uVar1;
  unit_struct *puVar2;
  bool bVar3;
  short sVar4;
  short sVar5;
  short sVar6;
  short sVar7;
  char local_2f;
  undefined2 local_2e;
  undefined1 local_2c;
  undefined1 local_2b;
  undefined1 local_28;
  undefined1 local_27;
  short local_24;
  ushort uStack_22;
  undefined4 local_20;
  short local_1c;
  short local_1a;
  uint local_18;
  int local_14;
  int local_10;
  undefined1 local_c;
  undefined1 uStack_b;
  undefined2 local_a;
  undefined1 uStack_9;
  undefined4 local_8;
  uint local_4;

  *param_4 = 0;
  local_2f = '\0';
  FUN_004a8e70(param_1,&local_c);
  local_2c = uStack_b;
  local_28 = (undefined1)((ushort)(param_2->pos).x >> 8);
  local_27 = (undefined1)((ushort)(param_2->pos).y >> 8);
  local_2b = uStack_9;
  FUN_004ea6b0(param_2,&local_28,&local_2c);
  sVar4 = FUN_004ea970(param_2,&local_28,&local_2c,0);
  if (sVar4 != 0) {
    uStack_22 = (ushort)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
    _local_24 = CONCAT22((uStack_22 & 0xfe00) + 0x100,
                         ((ushort)*(undefined4 *)(param_1 + 0x3d) & 0xfe00) + 0x100);
    local_10 = 0;
    local_14 = 0;
    sVar4 = *(short *)(param_1 + 0x26);
    sVar6 = (short)local_20;
    do {
      if (local_14 != 0) goto LAB_0043c5ae;
      local_18 = (uint)*(byte *)(param_1 + 0x31);
      sVar7 = local_1c;
      if (*(byte *)(param_1 + 0x31) < 0x32) {
        do {
          local_1c = sVar7;
          if (local_14 != 0) break;
          uVar1 = *(undefined4 *)(&DAT_00974048 + local_18 * 4);
          local_8._2_2_ = (short)((uint)uVar1 >> 0x10);
          local_8._0_2_ = (short)uVar1;
          switch((short)((int)((int)sVar4 + ((int)sVar4 >> 0x1f & 0x1ffU)) >> 9)) {
          case 0:
            local_1a = local_8._2_2_;
            sVar7 = (short)local_8;
            break;
          case 1:
            local_1a = -(short)local_8;
            sVar7 = local_8._2_2_;
            break;
          case 2:
            local_1a = -local_8._2_2_;
            sVar7 = -(short)local_8;
            break;
          case 3:
            sVar7 = -local_8._2_2_;
            local_1a = (short)local_8;
          }
          sVar6 = local_24 + sVar7;
          sVar5 = local_1a + uStack_22;
          local_20 = CONCAT22(sVar5,(short)local_20);
          local_2c = (undefined1)((ushort)sVar6 >> 8);
          local_2b = (undefined1)((ushort)sVar5 >> 8);
          if (local_10 == 0) {
            bVar3 = false;
            local_2e = CONCAT11(local_2b,local_2c);
            for (puVar2 = unit_land_array
                          [(short)(&game_state.level_data[0].unit_index)
                                  [((local_2e & 0xfe) * 2 | local_2e & 0xfe00) * 2]];
                puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
              if ((((puVar2->unit_class == '\x01') && (puVar2->field36_0x5f == 0)) &&
                  (puVar2 != param_2)) && (((puVar2->pos).x == sVar6 && ((puVar2->pos).y == sVar5)))
                 ) {
                bVar3 = true;
                break;
              }
            }
            if (!bVar3) goto LAB_0043c527;
          }
          else {
LAB_0043c527:
            local_28 = (undefined1)((ushort)(param_2->pos).x >> 8);
            local_27 = (undefined1)((ushort)(param_2->pos).y >> 8);
            local_8 = uVar1;
            FUN_004ea6b0(param_2,&local_28,&local_2c);
            sVar5 = FUN_004ea970(param_2,&local_28,&local_2c,0);
            if (sVar5 == 0) {
              param_2->flags_4 = param_2->flags_4 & 0xefffffff;
            }
            else {
              local_14 = 1;
              local_4 = local_18;
            }
          }
          local_18 = local_18 + 1;
          local_1c = sVar7;
        } while ((int)local_18 < 0x32);
      }
      local_10 = local_10 + 1;
    } while (local_10 < 2);
    if (local_14 != 0) {
LAB_0043c5ae:
      local_20 = CONCAT22(local_20._2_2_,sVar6);
      *param_4 = local_4;
      *param_3 = local_20;
      local_2f = (1 < local_10) + '\x01';
    }
  }
  return local_2f;
}
