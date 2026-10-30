/* Ghidra 12.1.3 pseudocode; entry 004a9d90; FUN_004a9d90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004a9d90(int param_1,int param_2)

{
  DWORD DVar1;
  undefined4 *puVar2;
  uint uVar3;
  undefined3 unaff_retaddr;
  undefined4 uVar4;
  undefined4 uVar5;
  undefined4 uVar6;
  byte local_1;

  if ((level_flags_1 & 0x8000000) != 0) {
    return 1;
  }
  DAT_005cdb78 = 1;
  switch(param_1) {
  case 0x1d:
    if (param_2 == 0) {
      DAT_0098e91c = DAT_0098e91c & 0xfb;
    }
    else {
      DAT_0098e91c = DAT_0098e91c | 4;
    }
    break;
  default:
    break;
  case 0x2a:
    if (param_2 == 0) {
      DAT_0098e91c = DAT_0098e91c & 0xfe;
    }
    else {
      DAT_0098e91c = DAT_0098e91c | 1;
    }
    break;
  case 0x36:
    if (param_2 == 0) {
      DAT_0098e91c = DAT_0098e91c & 0xfd;
    }
    else {
      DAT_0098e91c = DAT_0098e91c | 2;
    }
    break;
  case 0x38:
    if (param_2 == 0) {
      DAT_0098e91c = DAT_0098e91c & 0xef;
    }
    else {
      DAT_0098e91c = DAT_0098e91c | 0x10;
    }
    break;
  case 0x9d:
    if (param_2 == 0) {
      DAT_0098e91c = DAT_0098e91c & 0xf7;
    }
    else {
      DAT_0098e91c = DAT_0098e91c | 8;
    }
    break;
  case 0xb8:
    if (param_2 == 0) {
      DAT_0098e91c = DAT_0098e91c & 0xdf;
    }
    else {
      DAT_0098e91c = DAT_0098e91c | 0x20;
    }
  }
  local_1 = (DAT_0098e91c & 3) != 0;
  if ((DAT_0098e91c & 0xc) != 0) {
    local_1 = local_1 | 2;
  }
  if ((DAT_0098e91c & 0x30) != 0) {
    local_1 = local_1 | 4;
  }
  *(char *)((int)&DAT_0098e928 + param_1) = (char)param_2;
  if (param_2 == 0) {
    (&DAT_00984591)[param_1] = 0;
    (&DAT_00984691)[param_1] = 1;
  }
  else {
    (&DAT_00984591)[param_1] = 1;
    (&DAT_00984691)[param_1] = 0;
    DAT_00984898 = param_1;
  }
  if (((font_type == 8) && (param_2 == 0)) &&
     (((param_1 == 0x38 && ((local_1 & 1) != 0)) || ((param_1 == 0x2a && ((local_1 & 4) != 0)))))) {
    DAT_0098e924 = (uint)(DAT_0098e924 == 0);
  }
  if ((DAT_0089bb81 == '\x02') || (DAT_0089bb81 == '\x03')) {
    if (param_2 == 0) {
      DAT_005cdb78 = 0;
      return 1;
    }
    if ((param_1 != 0x1c) && (param_1 != 0x9c)) {
      DAT_005cdb78 = 0;
      return 1;
    }
    uVar6 = 0;
    uVar5 = 0;
    uVar4 = 0xb0;
  }
  else {
    if ((opened_files_flags & 0x4010) != 0) {
      if (param_2 == 0) {
        DAT_005cdb78 = 0;
        return 1;
      }
      if ((opened_files_flags & 4) == 0) {
        DAT_005cdb78 = 0;
        return 1;
      }
      if (DAT_0098f750 == '\x03') {
        DAT_005cdb78 = 0;
        return 1;
      }
      DAT_0059d110 = 0;
      FUN_004b2700();
      DAT_0089d161 = DAT_0098f712;
      FUN_0049cfa0(2);
      FUN_004b4770();
      DAT_005cdb78 = 0;
      return 1;
    }
    if ((level_flags_1 & 0x10000000) == 0) {
      if (((level_flags_1 & 0x20) == 0) || (param_2 == 0)) {
        if (DAT_0089c6e7 == '\x04') {
          FUN_004ae5b0(param_1,CONCAT31(unaff_retaddr,local_1),param_2);
          if (param_2 == 0) {
            DAT_005cdb78 = 0;
            return 1;
          }
          DVar1 = GetTickCount();
          DAT_005cdb74 = DVar1 + 200;
          DAT_005cdb78 = 0;
          return 1;
        }
        puVar2 = (undefined4 *)FUN_004ffb90();
        uVar6 = puVar2[1];
        uVar5 = *puVar2;
        uVar3 = CONCAT31((int3)((uint)puVar2 >> 8),-(param_2 == 0)) & 0xffffff03;
        uVar4 = FUN_00489470(param_1,CONCAT31(unaff_retaddr,local_1),
                             CONCAT31((int3)(uVar3 >> 8),(char)uVar3 + '\x01'));
      }
      else if ((land_flags_1._3_1_ & 6) == 0) {
        uVar6 = 0;
        uVar5 = 0;
        uVar4 = 99;
      }
      else {
        if (param_1 != 0x39) {
          DAT_005cdb78 = 0;
          return 1;
        }
        uVar6 = 0;
        uVar5 = 0;
        uVar4 = 99;
      }
    }
    else {
      if (param_2 == 0) {
        DAT_005cdb78 = 0;
        return 1;
      }
      if (param_1 == 1) {
        if ((local_1 & 1) != 0) {
          if (game_state.some_unit != (unit_struct *)0x0) {
            *(undefined1 *)&(game_state.some_unit)->loc_3_z = 1;
            DAT_005cdb78 = 0;
            return 1;
          }
          FUN_004af1c0(1);
          DAT_005cdb78 = 0;
          return 1;
        }
        uVar6 = 0;
        uVar5 = 0;
        uVar4 = 0x9b;
      }
      else {
        if (param_1 != 0x39) {
          DAT_005cdb78 = 0;
          return 1;
        }
        if (((load_level_flags._3_1_ & 4) == 0) && ((game_state._838239_1_ & 1) != 0)) {
          FUN_00449080();
        }
        if ((land_flags_1._3_1_ & 6) == 0) {
          DAT_005cdb78 = 0;
          return 1;
        }
        if ((((byte)land_flags_1 & 8) == 0) || ((game_state.level_flags & 2) == 0)) {
          uVar6 = 0;
          uVar5 = 0;
          uVar4 = 0x5b;
        }
        else {
          if ((level_flags_1 & 0x20) == 0) {
            level_flags_1 = level_flags_1 | 0x20;
            DAT_005cdb78 = 0;
            return 1;
          }
          uVar6 = 0;
          uVar5 = 0;
          uVar4 = 99;
        }
      }
    }
  }
  process_cmd(uVar4,uVar5,uVar6);
  DAT_005cdb78 = 0;
  return 1;
}
