/* Ghidra 12.1.3 pseudocode; entry 004adbb0; FUN_004adbb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_004adbb0(void)

{
  unit_struct *puVar1;
  int *piVar2;
  int iVar3;
  DWORD DVar4;
  int iVar5;
  unit_struct *puVar6;
  uint uVar7;
  int iVar8;
  undefined4 uVar9;

  iVar8 = (int)player_tribe_num;
  piVar2 = (int *)FUN_004ffb90();
  if (((((land_flags_1._2_1_ & 8) == 0) && (DAT_0098e910 == '\0')) &&
      ((level_flags_1._3_1_ & 0x80) == 0)) && (iVar3 = FUN_00451370(2), iVar3 == 0)) {
    if (*piVar2 < 1) {
      uVar9 = 4;
LAB_004adc21:
      set_data_to_rddata_chunk(2,uVar9,0);
    }
    else if (screen_width + -1 <= *piVar2) {
      uVar9 = 8;
      goto LAB_004adc21;
    }
    if (piVar2[1] < 1) {
      uVar9 = 1;
    }
    else {
      if (piVar2[1] < screen_height + -1) goto LAB_004adc52;
      uVar9 = 2;
    }
    set_data_to_rddata_chunk(2,uVar9,0);
  }
LAB_004adc52:
  screen_coord_3_x = *piVar2;
  screen_coord_3_y = piVar2[1];
  if (DAT_0098e910 == '\x01') {
    DAT_0089bc17 = 0;
    FUN_00448fa0();
    FUN_00417c00(0);
    game_state._838940_1_ = 0;
    game_state._838943_1_ = game_state._838943_1_ & 0xfd;
    iVar5 = *piVar2 - _DAT_0098e911;
    iVar3 = DAT_00895dad * 8 + 0x78;
    if (iVar3 < 0) {
      iVar3 = 0;
    }
    if (0xff < iVar3) {
      iVar3 = 0xff;
    }
    FUN_00442920((piVar2[1] - _DAT_0098e915) * 0xc,iVar3);
    FUN_00442880(iVar5 * 0xc,iVar3);
    DAT_0089ce68 = (undefined2)*piVar2;
    DAT_0089ce6a = (undefined2)piVar2[1];
    _DAT_0098e911 = *piVar2;
    _DAT_0098e915 = piVar2[1];
  }
  else if (DAT_0098e910 == '\x02') {
    DAT_0089bc17 = 0;
    DAT_0089ce35 = 0;
    FUN_00417c00(0);
    FUN_00419a60(0,0,0);
    DAT_0089ce68 = (undefined2)*piVar2;
    iVar5 = *piVar2 - _DAT_0098e911;
    DAT_0089ce6a = (undefined2)piVar2[1];
    _DAT_0098e911 = *piVar2;
    iVar3 = DAT_00895dad * 8 + 0x78;
    _DAT_0098e915 = piVar2[1];
    if (iVar3 < 0) {
      iVar3 = 0;
    }
    if (0xff < iVar3) {
      iVar3 = 0xff;
    }
    rotate_main_cam(iVar5,iVar3);
  }
  switch(DAT_0089c6e7) {
  case 4:
    if ((sprite_animation_counter == DAT_0089c6ad) || (DVar4 = GetTickCount(), DVar4 < DAT_005cdb74)
       ) break;
    if (DAT_0098e9f3 == '\0') {
      if (DAT_0098e9f5 != '\0') {
        uVar9 = 0xcd;
        goto LAB_004ade20;
      }
      if (DAT_0098e9fb != '\0') {
        uVar9 = 0xd3;
        goto LAB_004ade20;
      }
      if (DAT_0098e936 != '\0') {
        uVar9 = 0xe;
        goto LAB_004ade20;
      }
    }
    else {
      uVar9 = 0xcb;
LAB_004ade20:
      FUN_004ae5b0(uVar9,0,1);
    }
    DAT_005cdb74 = DVar4 + 0x32;
    break;
  case 9:
    if (((byte)level_flags & 1) == 0) {
      set_data_to_rddata_chunk(0x6b,0,_minimap_related_1);
    }
    else {
      set_tribe_command(player_tribe_num,0x24,0,minimap_state_and_cache);
    }
    break;
  case 0xc:
    iVar8 = (int)player_tribe_num;
    if ((*(int *)&game_state.tribes_array[iVar8].field_0x92d < 1) &&
       (*(int *)&game_state.tribes_array[iVar8].field_0x931 < 1)) {
      set_tribe_command(CONCAT31((int3)((uint)(iVar8 * 0xc65) >> 8),player_tribe_num),0x1e,0,0);
    }
    break;
  case 0xe:
    if (DAT_0089ce43 == '\0') {
      FUN_0048a050(0,0x25,1);
    }
    else if (((byte)level_flags & 0x80) == 0) {
      if (-1 < DAT_0089c6e1) {
        if ((int)DAT_0089c6e1 != (minimap_state_and_cache & 0xffff)) {
          DAT_0089d160 = '\x01';
        }
        if (DAT_0089d160 != '\0') {
          set_tribe_command(iVar8,0x65,game_state.tribes_array[iVar8].field1414_0x969[0x22],
                            minimap_state_and_cache);
        }
      }
    }
    else if (DAT_0089ce43 != '\0') {
      if (((DAT_00984681 != '\0') && (DAT_00984781 == '\0')) ||
         (uVar9 = 99, (_DAT_00899d7b & 1 << (DAT_0089cf07 & 0x1f)) != 0)) {
        uVar9 = 100;
      }
      set_tribe_command(iVar8,uVar9,0,minimap_state_and_cache);
    }
    break;
  case 0xf:
    puVar6 = (unit_struct *)0x0;
    if (((DAT_0089c6cb != 0) &&
        (puVar1 = unit_land_array[DAT_0089c6cb], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
       (puVar1->unit_class != '\0')) {
      puVar6 = puVar1;
    }
    if (puVar6 == (unit_struct *)0x0) {
      DAT_0089c6cb = 0;
    }
    if ((DAT_0089c6cb != 0) && ((int)(short)DAT_0089c6cb == (uint)unit_index_1)) break;
    goto LAB_004ae052;
  case 0x10:
    if ((minimap_state_and_cache & 0x10000) == 0) break;
    uVar7 = (int)minimap_related_1 - (int)(short)DAT_0089bb5d >> 0x1f;
    iVar3 = ((int)minimap_related_1 - (int)(short)DAT_0089bb5d ^ uVar7) - uVar7;
    if (0x7fff < iVar3) {
      iVar3 = 0xffff - iVar3;
    }
    if (iVar3 < 0x101) {
      uVar7 = (int)DAT_0087cae0 - (int)DAT_0089bb5d._2_2_ >> 0x1f;
      iVar3 = ((int)DAT_0087cae0 - (int)DAT_0089bb5d._2_2_ ^ uVar7) - uVar7;
      if (0x7fff < iVar3) {
        iVar3 = 0xffff - iVar3;
      }
      if (iVar3 < 0x101) break;
    }
LAB_004ae052:
    set_data_to_rddata_chunk(0x6a,(DAT_0098e908 & 0x100) != 0,DAT_0089bb5d);
    FUN_0047a550(9,iVar8 * 0xc65 + 0x89d1c8);
  }
  FUN_0047acb0();
  if ((((DAT_0098e908 & 0x40) != 0) && (FUN_0047ae00(0,0), (DAT_0098e908 & 0x80) == 0)) &&
     ((DAT_0089c6cd == 0 ||
      (((uint)unit_index_1 != (int)DAT_0089c6cd && ((uint)unit_index_2 != (int)DAT_0089c6cd)))))) {
    DAT_0098e908 = DAT_0098e908 & 0xffbf;
  }
  if ((DAT_0098e908 & 1) != 0) {
    set_tribe_command(player_tribe_num,0x17,(int)DAT_00895d9a,0);
  }
  if (((DAT_00984593 != '\0') && (DAT_00984693 == '\0')) && (DAT_0089d168 != -1)) {
    DAT_0089d168 = '\x06';
  }
  if (((DAT_00984594 != '\0') && (DAT_00984694 == '\0')) && (DAT_0089d169 != -1)) {
    DAT_0089d169 = '\x06';
  }
  if ((((char)DAT_00984595 != '\0') && ((char)DAT_00984695 == '\0')) && (DAT_0089d16a != -1)) {
    DAT_0089d16a = '\x06';
  }
  if (((DAT_00984595._1_1_ != '\0') && (DAT_00984695._1_1_ == '\0')) && (DAT_0089d16b != -1)) {
    DAT_0089d16b = '\x06';
  }
  if (((DAT_00984595._2_1_ != '\0') && (DAT_00984695._2_1_ == '\0')) && ((char)DAT_0089d16c != -1))
  {
    DAT_0089d16c._0_1_ = '\x06';
  }
  if (((DAT_00984595._3_1_ != '\0') && (DAT_00984695._3_1_ == '\0')) && (DAT_0089d16c._1_1_ != -1))
  {
    DAT_0089d16c._1_1_ = '\x06';
  }
  return;
}
