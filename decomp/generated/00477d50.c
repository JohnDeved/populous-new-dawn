/* Ghidra 12.1.3 pseudocode; entry 00477d50; FUN_00477d50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00477d50(int param_1)

{
  unit_struct *puVar1;
  ushort uVar2;
  unit_type_scenery *puVar3;
  short sVar4;
  undefined4 in_EAX;
  int iVar5;
  undefined2 extraout_var;
  uint uVar6;
  undefined2 uVar7;
  ushort *puVar8;
  int iVar9;
  char local_1c;
  char cStack_1b;
  byte local_1a;
  byte bStack_19;
  short local_14;
  short local_12;
  int local_10;
  int local_c;
  short local_8;
  short local_6;
  undefined2 local_4;

  uVar7 = (undefined2)((uint)in_EAX >> 0x10);
  DAT_0089ce82 = 0x10;
  load_level_flags = load_level_flags | 0x40;
  if (*(short *)(param_1 + 0x72) == 0x80) {
    FUN_0048a050(param_1,0xb0,0);
    local_10 = param_1 + 0x3d;
    local_c = 0x18;
    uVar2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
    local_1c = (char)uVar2;
    cStack_1b = (char)(uVar2 >> 8);
    bStack_19 = cStack_1b - 0x16;
    do {
      iVar9 = 0x18;
      local_1a = local_1c - 0x16;
      do {
        local_14 = (ushort)local_1a << 8;
        local_4 = 0;
        local_12 = (ushort)bStack_19 << 8;
        local_8 = local_14;
        local_6 = local_12;
        iVar5 = calc_distance_toroidal(&local_14,local_10);
        if (iVar5 < 0x1601) {
          for (puVar1 = unit_land_array
                        [(short)(&game_state.level_data[0].unit_index)
                                [((CONCAT11(bStack_19,local_1a) & 0xfe) * 2 |
                                 CONCAT11(bStack_19,local_1a) & 0xfe00) * 2]]; iVar5 = 0,
              puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
            if (puVar1->unit_class == '\x02') {
              if ((*(byte *)((int)&puVar1->flags_2 + 2) & 0x10) == 0) {
                empty_unit_function(puVar1);
                puVar1->state = 3;
                init_unit_class(puVar1);
              }
              puVar1->state_2 = 1;
              puVar1->flags_2 = puVar1->flags_2 | 0x40000000;
            }
            else if (((puVar1->unit_class == '\x05') &&
                     (puVar3 = unit_type_array_scenery + (byte)puVar1->unit_type,
                     uVar6._0_1_ = puVar3->flags_1, uVar6._1_1_ = puVar3->flags,
                     uVar6._2_1_ = puVar3->field14_0x16, uVar6._3_1_ = puVar3->field15_0x17,
                     (uVar6 & 0x10) != 0)) && ((*(byte *)&puVar1->loc_4_z & 4) == 0)) {
              alloc_unit(7,5,CONCAT31((int3)((uint)(byte)puVar1->unit_type * 3 >> 8),
                                      puVar1->tribe_index),&local_8);
            }
          }
        }
        uVar7 = (undefined2)((uint)iVar5 >> 0x10);
        if ((level_flags & 4) != 0) {
          FUN_00450610(3,CONCAT13(bStack_19,CONCAT12(local_1a,CONCAT11(bStack_19,local_1a))));
          uVar7 = extraout_var;
        }
        local_1a = local_1a + 2;
        iVar9 = iVar9 + -1;
      } while (iVar9 != 0);
      local_c = local_c + -1;
      bStack_19 = bStack_19 + 2;
    } while (local_c != 0);
  }
  if (*(short *)(param_1 + 0x72) < 0x41) {
    if (*(short *)(param_1 + 0x72) == 0x40) {
      *(undefined1 *)(param_1 + 0x88) = 1;
    }
    local_10 = param_1 + 0x3d;
    uVar2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
    local_c = 0x18;
    puVar8 = &DAT_0059dea6;
    local_1c = (char)uVar2;
    cStack_1b = (char)(uVar2 >> 8);
    bStack_19 = cStack_1b - 0x16;
    do {
      iVar9 = 0x18;
      local_1a = local_1c - 0x16;
      do {
        local_14 = (ushort)local_1a << 8;
        local_12 = (ushort)bStack_19 << 8;
        iVar5 = calc_distance_toroidal(&local_14,local_10);
        if (iVar5 < 0x1601) {
          uVar6 = (CONCAT11(bStack_19,local_1a) & 0xfe) * 2 | CONCAT11(bStack_19,local_1a) & 0xfe00;
          sVar4 = (&game_state.level_data[0].height)[uVar6 * 2];
          (&game_state.level_data[0].height)[uVar6 * 2] =
               (short)((int)((uint)*puVar8 - (int)sVar4) / (int)*(short *)(param_1 + 0x72)) + sVar4;
        }
        puVar8 = puVar8 + -1;
        iVar9 = iVar9 + -1;
        local_1a = local_1a + 2;
      } while (iVar9 != 0);
      local_c = local_c + -1;
      bStack_19 = bStack_19 + 2;
    } while (local_c != 0);
    land_level_processing_1(uVar2,0x10,1);
    FUN_0044f2f0(1,uVar2,0x10,0xffffffff);
    uVar7 = 0;
    game_state.start_24[0] = 0;
    game_state.start_24[1] = 0;
    game_state.start_24[2] = 0;
    game_state.start_24[3] = 0;
  }
  sVar4 = *(short *)(param_1 + 0x72) + -1;
  *(short *)(param_1 + 0x72) = sVar4;
  return CONCAT31((int3)(CONCAT22(uVar7,sVar4) >> 8),sVar4 < 1);
}
