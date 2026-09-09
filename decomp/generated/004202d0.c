/* Ghidra 12.1.3 pseudocode; entry 004202d0; FUN_004202d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004202d0(undefined4 param_1,unit_struct *param_2,int param_3)

{
  unit_struct *puVar1;
  byte bVar2;
  byte bVar3;
  bool bVar4;
  ushort uVar5;
  undefined1 uVar6;
  undefined1 uVar7;
  int iVar8;
  undefined4 extraout_EDX;
  int iVar9;
  int iVar10;
  unit_struct *puStack_74;
  unit_struct *puStack_70;
  undefined1 local_59;
  char cStack_56;
  char cStack_55;
  undefined2 local_54;
  char local_52;
  char cStack_51;
  int local_50;
  unit_struct *local_44;
  unit_struct *local_40;
  unit_struct *local_3c;
  int local_38;
  undefined1 *local_34;
  undefined1 *local_30;
  undefined1 *local_2c;
  undefined4 local_28;
  unit_struct *local_24;
  int local_20;
  undefined4 local_1c;
  undefined4 local_8;

  puStack_70 = (unit_struct *)0x4202ed;
  clear_surface_mem();
  bVar2 = level_flags_2._1_1_ & 1;
  bVar3 = level_flags_2._1_1_ & 2;
  local_28 = param_1;
  puStack_70 = (unit_struct *)&stack0xffffffd8;
  local_24 = param_2;
  local_20 = param_3;
  local_1c._0_2_ = 0x100;
  local_1c._2_1_ = 0;
  local_1c._3_1_ = 0;
  local_8 = 8;
  puStack_74 = (unit_struct *)0x420343;
  set_surface_mem();
  puStack_70 = (unit_struct *)0x42034b;
  iVar8 = always_returns_0();
  puStack_70 = (unit_struct *)0x420352;
  clear_level_flag_0x200000();
  puStack_70 = (unit_struct *)&local_44;
  local_44 = (unit_struct *)0x0;
  local_3c = param_2;
  local_40 = (unit_struct *)0x0;
  local_38 = param_3;
  puStack_74 = (unit_struct *)0x420374;
  FUN_004ffae0();
  if (iVar8 != 0) {
    puStack_70 = (unit_struct *)0x420380;
    FUN_00499910();
  }
  local_44 = (unit_struct *)
             (CONCAT31(local_44._1_3_,
                       (char)((ushort)game_state.tribes_array[player_tribe_num].x >> 8)) &
             0xfffffffe);
  local_44 = (unit_struct *)
             (CONCAT22(local_44._2_2_,
                       CONCAT11((char)((ushort)game_state.tribes_array[player_tribe_num].y >> 8),
                                local_44._0_1_)) & 0xfffffeff);
  cStack_56 = (char)local_44;
  cStack_55 = (char)((uint)local_44 >> 8);
  for (puVar1 = allocated_units; puVar1 != (unit_struct *)0x0; puVar1 = puVar1->next_unit_1) {
    bVar4 = true;
    if ((((byte)level_flags & 4) != 0) &&
       (local_54 = CONCAT11((char)((ushort)(puVar1->pos).y >> 8),
                            (char)((ushort)(puVar1->pos).x >> 8)),
       (*(byte *)(&game_state.level_data[0].flags + ((local_54 & 0xfe) * 2 | local_54 & 0xfe00)) & 8
       ) == 0)) {
      bVar4 = false;
    }
    iVar8 = 0;
    if (bVar4) {
      bVar4 = false;
      switch(puVar1->unit_class) {
      case 1:
        if (puVar1->tribe_index == -1) {
          local_59 = 0xbf;
          bVar4 = true;
          local_50 = 1;
        }
        else if ((*(byte *)((int)&puVar1->flags_4 + 3) & 0x40) == 0) {
          puStack_74 = (unit_struct *)0x42045a;
          puStack_70 = puVar1;
          iVar9 = FUN_004f1370();
          if ((iVar9 != 0) || (bVar2 == 0)) {
            local_50 = 0;
            bVar4 = true;
            local_59 = global_palette_indexes_2[(char)puVar1->tribe_index * 5 + 1];
          }
        }
        break;
      case 2:
        puStack_74 = (unit_struct *)0x4204a0;
        puStack_70 = puVar1;
        iVar9 = FUN_004f1370();
        if ((iVar9 != 0) || (bVar3 == 0)) {
          bVar4 = true;
          local_59 = global_palette_indexes_2[(char)puVar1->tribe_index * 5 + 2];
        }
        break;
      case 6:
        if (puVar1->unit_type == '\x02') {
          bVar4 = true;
          local_50 = 1;
          local_59 = DAT_0089c6f5;
        }
        break;
      case 10:
        if (puVar1->unit_type == '\b') {
          bVar4 = true;
          iVar8 = 0x3b;
        }
      }
      if (bVar4) {
        uVar6 = (undefined1)((ushort)(puVar1->pos).x >> 8);
        uVar7 = (undefined1)((ushort)(puVar1->pos).y >> 8);
        uVar5 = CONCAT11(uVar7,uVar6) & 0xfefe;
        local_52 = (char)uVar5;
        cStack_51 = (char)(uVar5 >> 8);
        iVar9 = (int)((uint)(byte)(local_52 + (-0x80 - cStack_56)) * (int)param_2) >> 8;
        iVar10 = param_3 - ((int)((uint)(byte)((cStack_51 - cStack_55) + 0x86) * param_3) >> 8);
        if ((puVar1->unit_class == '\x01') && (puVar1->unit_type == '\a')) {
          puStack_74 = (unit_struct *)
                       (CONCAT13(cStack_56,CONCAT12(uVar7,CONCAT11(uVar6,local_59))) & 0xfffefeff);
          puStack_70 = (unit_struct *)0x1;
          FUN_005255b0(iVar9,iVar10,(2 >> (DAT_0089c67d & 0x1f)) + 1);
          puStack_74 = (unit_struct *)CONCAT31((int3)((uint)extraout_EDX >> 8),DAT_0089c6f5);
          puStack_70 = (unit_struct *)0x0;
          FUN_005255b0(iVar9,iVar10,(2 >> (DAT_0089c67d & 0x1f)) + 1);
        }
        else if (iVar8 == 0) {
          local_44 = (unit_struct *)&puStack_74;
          set_indexed_value_from_system_palette
                    (CONCAT13(cStack_56,CONCAT12(uVar7,CONCAT11(uVar6,local_59))) & 0xfffefeff);
          FUN_00527d10(iVar9,iVar10);
          if (local_50 == 0) {
            local_34 = (undefined1 *)&puStack_74;
            set_indexed_value_from_system_palette
                      (CONCAT13(cStack_56,CONCAT12(uVar7,CONCAT11(uVar6,local_59))) & 0xfffefeff);
            FUN_00527d10(iVar9 + 1,iVar10 + 1);
            local_30 = (undefined1 *)&puStack_74;
            set_indexed_value_from_system_palette
                      (CONCAT13(cStack_56,CONCAT12(uVar7,CONCAT11(uVar6,local_59))) & 0xfffefeff);
            FUN_00527d10(iVar9,iVar10 + 1);
            local_2c = (undefined1 *)&puStack_74;
            set_indexed_value_from_system_palette
                      (CONCAT13(cStack_56,CONCAT12(uVar7,CONCAT11(uVar6,local_59))) & 0xfffefeff);
            FUN_00527d10(iVar9 + 1,iVar10);
          }
        }
        else if (((byte)game_state.offset_counter & 4) != 0) {
          puStack_70 = (unit_struct *)(iVar8 * 8 + hfx_0_addr);
          puStack_74 = (unit_struct *)
                       (iVar10 - (uint)(*(ushort *)((int)&puStack_70->next_unit_1 + 2) >> 1));
          add_polygon_rect_sprite(iVar9 - (uint)(*(ushort *)&puStack_70->next_unit_1 >> 1));
        }
      }
    }
  }
  if (is_surface_locked != '\0') {
    puStack_70 = (unit_struct *)0x42068d;
    puStack_70 = (unit_struct *)get_d3d_struct_ptr();
    puStack_74 = (unit_struct *)0x420693;
    set_surface_mem_global();
  }
  puStack_70 = (unit_struct *)0x0;
  puStack_74 = (unit_struct *)0x42069d;
  FUN_004ffae0();
  return;
}
