/* Ghidra 12.1.3 pseudocode; entry 004aa1c0; FUN_004aa1c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_004aa1c0(int param_1,int param_2,int param_3,int param_4)

{
  char cVar1;
  int iVar2;
  uint uVar3;
  undefined3 unaff_retaddr;
  undefined4 uVar4;
  byte local_1;

  if ((level_flags_1._3_1_ & 8) != 0) {
    return 1;
  }
  DAT_005cdb78 = 1;
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
  }
  if (((screen_width == 0x200) && (screen_height == 0x180)) &&
     (iVar2 = always_returns_0(), iVar2 != 0)) {
    param_3 = param_3 - DAT_00a69078;
    param_4 = param_4 - DAT_00a6907c;
  }
  if (param_1 == 0xf0) {
    if (param_2 == 0) {
      DAT_0098456c = 1;
      _DAT_00984588 = param_3;
      _DAT_0098458c = param_4;
    }
    else {
      global_data_3 = 1;
      DAT_00984578 = param_3;
      DAT_0098457c = param_4;
    }
  }
  else if (param_1 == 0xf1) {
    if (param_2 == 0) {
      DAT_00984574 = 1;
      _DAT_00984588 = param_3;
      _DAT_0098458c = param_4;
    }
    else {
      _DAT_00984568 = 1;
      DAT_00984578 = param_3;
      DAT_0098457c = param_4;
    }
  }
  else if (param_1 == 0xf2) {
    if (param_2 == 0) {
      _DAT_00984570 = 1;
      _DAT_00984588 = param_3;
      _DAT_0098458c = param_4;
    }
    else {
      _DAT_00984564 = 1;
      DAT_00984578 = param_3;
      DAT_0098457c = param_4;
    }
  }
  if ((DAT_0089bb81 == '\x02') || (DAT_0089bb81 == '\x03')) {
    if (param_1 != 0xf0) {
      DAT_005cdb78 = 0;
      return 1;
    }
    if (param_2 != 0) {
      DAT_005cdb78 = 0;
      return 1;
    }
    if (DAT_0089bb81 == '\x03') {
      DAT_005cdb78 = 0;
      return 1;
    }
    uVar4 = 0x66;
  }
  else {
    if ((level_flags_1._3_1_ & 0x10) != 0) {
      if (param_2 == 0) {
        DAT_005cdb78 = 0;
        return 1;
      }
      if (((byte)opened_files_flags & 4) == 0) {
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
    if ((((byte)level_flags_1 & 0x20) == 0) || (param_2 == 0)) {
      if (((DAT_0098e910 == '\x01') || (DAT_0098e910 == '\x02')) &&
         ((param_1 == 0xf2 && (param_2 == 0)))) {
        uVar4 = FUN_00489470(0xf2,CONCAT31(unaff_retaddr,local_1),4);
      }
      else {
        DAT_0059cd80 = (uint)DAT_0098ea18;
        DAT_0059cd84 = (uint)DAT_0098ea19;
        DAT_00684208 = param_3;
        DAT_0068420c = param_4;
        FUN_0044b130();
        iVar2 = FUN_0044b060();
        if ((iVar2 != 0) &&
           (((DAT_005cae80 == -1 && (DAT_0089c6e7 != '\t')) && (DAT_0089c6e7 != '\x0f')))) {
          if (DAT_005cae74 == '\0') {
            DAT_005cdb78 = 0;
            return 1;
          }
          if ((DAT_0098e908._1_1_ & 4) == 0) {
            DAT_005cdb78 = 0;
            return 1;
          }
        }
        cVar1 = FUN_00431140(param_1,CONCAT31(unaff_retaddr,local_1),param_2,param_3,param_4);
        if (cVar1 != '\0') {
          DAT_005cdb78 = 0;
          return 1;
        }
        uVar4 = FUN_0047b460(param_1,CONCAT31(unaff_retaddr,local_1),param_2,param_3,param_4);
        if ((char)uVar4 != '\0') {
          DAT_005cdb78 = 0;
          return 1;
        }
        uVar3 = CONCAT31((int3)((uint)uVar4 >> 8),-(param_2 == 0)) & 0xffffff03;
        uVar4 = FUN_00489470(param_1,CONCAT31(unaff_retaddr,local_1),
                             CONCAT31((int3)(uVar3 >> 8),(char)uVar3 + '\x01'));
      }
    }
    else if ((land_flags_1._3_1_ & 6) == 0) {
      uVar4 = 99;
    }
    else {
      if (param_1 != 0x39) {
        DAT_005cdb78 = 0;
        return 1;
      }
      uVar4 = 99;
    }
  }
  process_cmd(uVar4,param_3,param_4);
  DAT_005cdb78 = 0;
  return 1;
}
