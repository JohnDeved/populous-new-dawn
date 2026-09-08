/* Ghidra 12.1.3 pseudocode; entry 0041c140; FUN_0041c140.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0041c140(void)

{
  short *psVar1;
  short *psVar2;
  short sVar3;
  unit_struct *puVar4;
  undefined4 uVar5;
  uint uVar6;
  byte bVar7;
  char cVar8;
  unit_struct *puVar9;
  ushort *puVar10;
  int iVar11;
  undefined1 *puVar12;
  undefined2 *puVar13;
  ushort *puVar14;
  int iVar15;
  ushort local_36;
  undefined4 local_34;
  char cStack_2e;
  char cStack_2d;
  byte bStack_2c;
  char cStack_2b;
  ushort local_2a;
  int local_28;
  uint local_24;
  short local_20;
  short sStack_1e;
  undefined2 local_1c;
  undefined4 local_18;
  short local_14;
  undefined1 local_10 [16];

  if ((game_state._4_4_ & 0x20) == 0) {
    game_state._4_4_ = game_state._4_4_ | 0x20;
    game_state._842010_4_ = DAT_005aa5d4 * 0xc + game_state.offset_counter_2;
    init_tribe_struct();
    local_24 = 0;
    local_28 = 0x89d1c8;
    do {
      if (*(char *)(local_28 + 0xc20) != '\0') {
        psVar1 = (short *)(local_28 + 0x911);
        FUN_0044ff80(psVar1,0xffffffff,0);
        local_18 = *(undefined4 *)psVar1;
        local_14 = *(undefined2 *)(local_28 + 0x915);
        iVar11 = *(int *)(local_28 + 0x89d);
        if (iVar11 != 0) {
          local_18 = *(undefined4 *)(iVar11 + 0x3d);
          local_14 = *(undefined2 *)(iVar11 + 0x41);
          FUN_004d4b50(*(undefined4 *)(local_28 + 0x89d));
        }
        iVar11 = 8;
        puVar14 = (ushort *)(local_28 + 0xa0d);
        puVar10 = puVar14;
        do {
          puVar9 = (unit_struct *)0x0;
          if (((*puVar10 != 0) &&
              (puVar4 = unit_land_array[*puVar10], (*(byte *)&puVar4->flags_2 & 1) == 0)) &&
             (puVar4->unit_class != '\0')) {
            puVar9 = puVar4;
          }
          if (puVar9 != (unit_struct *)0x0) {
            FUN_004ef180(puVar9);
          }
          puVar10 = puVar10 + 1;
          iVar11 = iVar11 + -1;
        } while (iVar11 != 0);
        *(uint *)(local_28 + 0x93d) = *(uint *)(local_28 + 0x93d) & 0xfffffffe;
        *(undefined4 *)psVar1 = local_18;
        *(short *)(local_28 + 0x915) = local_14;
        uVar6 = CONCAT11((char)((uint)local_18 >> 0x18),(char)((uint)local_18 >> 8)) & 0xfefe;
        local_34 = uVar6 << 0x10;
        cStack_2e = (char)uVar6;
        cStack_2d = (char)(uVar6 >> 8);
        FUN_0044fcb0(local_10,CONCAT13(cStack_2b,
                                       CONCAT12(bStack_2c,CONCAT11(cStack_2d + -5,cStack_2e + -5))),
                     CONCAT13(cStack_2d + -5,
                              CONCAT12(cStack_2e + -5,
                                       CONCAT11(cStack_2d + '\x05',cStack_2e + '\x05'))));
        local_14 = FUN_0044eb40(local_10);
        local_14 = local_14 + 10;
        *(short *)(local_28 + 0xa0b) = local_14;
        alloc_unit(7,8,CONCAT31((int3)((uint)local_28 >> 8),(undefined1)local_24),&local_18);
        puVar12 = null_ARRAY_005a9f10;
        FUN_0044ff80(psVar1,CONCAT31((int3)((uint)puVar10 >> 8),(undefined1)local_24),1);
        do {
          uVar5 = *(undefined4 *)psVar1;
          sStack_1e = (short)((uint)uVar5 >> 0x10);
          local_1c = *(undefined2 *)(local_28 + 0x915);
          local_36 = CONCAT11((char)((uint)uVar5 >> 0x18),(char)((uint)uVar5 >> 8)) & 0xfefe;
          bStack_2c = (byte)local_36;
          cStack_2b = (char)(local_36 >> 8);
          bStack_2c = bStack_2c + *(char *)&((anibl0_struct *)puVar12)->bl320_sprite_ptr;
          cStack_2b = cStack_2b + *(char *)((int)&((anibl0_struct *)puVar12)->bl320_sprite_ptr + 1);
          local_20 = ((bStack_2c & 0xfe) + 1) * 0x100;
          local_2a = CONCAT11(cStack_2b,bStack_2c) & 0xfefe;
          uVar5 = CONCAT22(sStack_1e,local_20);
          sStack_1e = ((local_2a >> 8) + 1) * 0x100;
          local_1c = calc_point_height(uVar5,CONCAT22(local_1c,sStack_1e));
          iVar11 = alloc_unit(5,0xc,local_24 & 0xff,&local_20);
          if (iVar11 != 0) {
            *puVar14 = *(ushort *)(iVar11 + 0x24);
          }
          puVar14 = puVar14 + 1;
          puVar12 = (undefined1 *)((int)&((anibl0_struct *)puVar12)->bl320_sprite_ptr + 2);
        } while (puVar12 < anibl0_mem);
        puVar13 = &DAT_005a810e;
        iVar11 = 1;
        do {
          bVar7 = struct_56B_get_spell_array_val(local_24,iVar11);
          cVar8 = FUN_004c2ae0(local_24,iVar11);
          *(byte *)(iVar11 + 0xc3c + local_28) = cVar8 << 4 | bVar7;
          iVar15 = iVar11 + 1;
          set_struct_56B_array_spell_val(local_24,iVar11,*(undefined1 *)(puVar13 + 0x17));
          puVar13 = puVar13 + 0x1f;
          iVar11 = iVar15;
        } while (iVar15 < 0x1f);
        if ((((byte)level_flags & 4) != 0) && (player_tribe_num * 0xc65 + 0x89d1c8 == local_28)) {
          local_34 = CONCAT31(local_34._1_3_,(char)((ushort)*psVar1 >> 8)) & 0xfffffffe;
          local_34 = CONCAT22(local_34._2_2_,
                              CONCAT11((char)((ushort)*(undefined2 *)(local_28 + 0x913) >> 8),
                                       (undefined1)local_34)) & 0xfffffeff;
          FUN_00450610(5,local_34);
        }
        if (*(char *)(local_28 + 0xc22) == player_tribe_num) {
          sVar3 = *(short *)(local_28 + 0x913);
          iVar11 = (int)player_tribe_num;
          psVar2 = &game_state.tribes_array[iVar11].x;
          *psVar2 = *psVar1;
          game_state.tribes_array[iVar11].y = sVar3;
          game_state.tribes_array[iVar11].angle_1 = 0;
          set_tex_struct_globe_x_y(psVar2);
          does_water_texture_exists = 1;
        }
      }
      local_28 = local_28 + 0xc65;
      local_24 = local_24 + 1;
    } while ((int)local_24 < 4);
    FUN_0044cc40(DAT_0068c6c5);
    FUN_004a2600();
    FUN_004a2610();
    FUN_004a2620(1);
    FUN_0044c650(DAT_0068c6c5);
    FUN_0044bb30();
  }
  return;
}
