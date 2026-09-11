/* Ghidra 12.1.3 pseudocode; entry 00494d10; FUN_00494d10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


byte FUN_00494d10(undefined4 param_1,undefined4 param_2,int param_3,undefined2 *param_4,char param_5
                 )

{
  unit_struct *puVar1;
  bool bVar2;
  undefined4 uVar3;
  unit_type_scenery *puVar4;
  char cVar5;
  int iVar6;
  uint uVar7;
  unit_struct *puVar8;
  ushort *puVar9;
  undefined1 uStack_31;
  undefined1 uStack_2f;
  byte bStack_2d;
  short local_2c;
  short sStack_2a;
  undefined2 local_28;
  undefined1 local_24;
  undefined1 local_23;
  undefined1 local_20;
  undefined1 local_1f;
  int local_1c;
  undefined4 local_18;
  int local_14;
  undefined1 local_10 [2];
  ushort local_e [7];

  local_18 = 0;
  local_14 = 0;
  FUN_00494720(local_10,param_1,param_2);
  puVar9 = local_e;
  local_1c = 0;
  do {
    local_2c = ((*puVar9 & 0xfe) + 1) * 0x100;
    bStack_2d = (byte)(*puVar9 >> 8) & 0xfe;
    uVar3 = CONCAT22(sStack_2a,local_2c);
    sStack_2a = (bStack_2d + 1) * 0x100;
    local_28 = calc_point_height(uVar3,CONCAT22(local_28,sStack_2a));
    cVar5 = FUN_005178d0(param_3,&local_2c);
    if (cVar5 == '\0') {
      uVar7 = (*puVar9 & 0xfe) * 2 | *puVar9 & 0xfe00;
      bVar2 = true;
      if ((((((byte)land_flags_1 & 8) == 0) && (player_tribe_num == param_5)) &&
          ((level_flags & 4) != 0)) &&
         ((*(byte *)(&game_state.level_data[0].flags + uVar7) & 8) == 0)) {
        bVar2 = false;
      }
      puVar8 = (unit_struct *)0x0;
      if (bVar2) {
        puVar1 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar7 * 2]];
        while ((puVar8 = (unit_struct *)0x0, puVar1 != (unit_struct *)0x0 &&
               ((puVar1->unit_class != '\x05' ||
                (puVar4 = unit_type_array_scenery + (byte)puVar1->unit_type,
                uVar7._0_1_ = puVar4->flags_1, uVar7._1_1_ = puVar4->flags,
                uVar7._2_1_ = puVar4->field14_0x16, uVar7._3_1_ = puVar4->field15_0x17,
                puVar8 = puVar1, (uVar7 & 4) == 0))))) {
          puVar1 = unit_land_array[puVar1->next_unit_index];
        }
      }
      if (puVar8 != (unit_struct *)0x0) {
        local_20 = (undefined1)param_1;
        local_24 = (undefined1)*puVar9;
        uStack_31 = (undefined1)((uint)param_1 >> 8);
        uStack_2f = (undefined1)(*puVar9 >> 8);
        local_1f = uStack_31;
        local_23 = uStack_2f;
        game_state._755258_2_ = SUB42(land_const_1,0);
        game_state._755280_4_ = param_3;
        game_state._755250_1_ = 1;
        game_state.start_3 = 0;
        game_state._755251_1_ = 0;
        game_state._755278_1_ = 0;
        iVar6 = FUN_00420840(0,param_3,&local_20,&local_24,0,0);
        game_state._755250_1_ = 0;
        if (iVar6 != 1) {
          local_1c = 1;
          local_18 = game_state.start_3;
          if (((uint)(byte)game_state._755251_1_ & ~(1 << (*(byte *)(param_3 + 0x2f) & 0x1f))) != 0)
          {
            local_14 = 1;
          }
          break;
        }
      }
    }
    puVar9 = puVar9 + 2;
  } while (puVar9 < &stack0x00000002);
  if (local_1c != 0) {
    *param_4 = (undefined2)local_18;
    return (local_14 == 0) - 1U & 2;
  }
  return 1;
}
