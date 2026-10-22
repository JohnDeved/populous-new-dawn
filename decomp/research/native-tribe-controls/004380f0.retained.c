/* Ghidra 12.1.3 pseudocode; entry 004380f0; FUN_004380f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_004380f0(void)

{
  uint uVar1;
  unit_struct *puVar2;
  undefined4 uVar3;
  uint uVar4;
  char cVar5;
  int iVar6;
  int iVar7;
  unit_struct *puVar8;
  uint uVar9;
  uint uVar10;
  byte bStack_d;
  short local_8;
  short sStack_6;
  undefined2 local_4;

  uVar4 = DAT_00895e7a;
  iVar6 = (int)player_tribe_num;
  DAT_00895e9b = '\0';
  uVar9 = (uint)*(byte *)((int)&DAT_00895ea0 + (uint)DAT_00895e9d);
  switch(uVar9) {
  case 1:
  case 2:
    DAT_00895e9b = '\x01';
    break;
  default:
    if (DAT_00895e7a == 0) break;
    DAT_00895e7e = DAT_00895e82;
    uVar1 = *(uint *)(&DAT_005a7dca + uVar9 * 0x16);
    if (((uVar1 & 1) != 0) && ((DAT_00895e7a & 1) != 0)) {
      DAT_00895e9b = '\x01';
    }
    if (((uVar1 & 4) != 0) && ((DAT_00895e7a & 1) != 0)) {
      DAT_00895e9b = '\x01';
    }
    if (((uVar1 & 0x40) != 0) && ((DAT_00895e7a & 0x10) != 0)) {
      DAT_00895e9b = '\x01';
    }
    uVar10 = uVar1 & 2;
    if ((uVar10 != 0) && ((DAT_00895e7a & 4) != 0)) {
      DAT_00895e9b = '\x01';
      DAT_00895e7e = DAT_00895e86;
    }
    if (uVar10 == 0) {
LAB_0043820d:
      if (uVar10 != 0) {
        if (((((DAT_00895e7a & 0x800) != 0) && (unit_land_array[DAT_00895e82] != (unit_struct *)0x0)
             ) && (iVar7 = FUN_00508f70(unit_land_array[DAT_00895e82]), iVar7 != 0)) &&
           (((game_state.tribes_array[iVar6].field_0xc23 & 0x80) != 0 ||
            (((*(byte *)(iVar7 + 0x6d) & 0x10) == 0 && (*(char *)(iVar7 + 0x68) != '\x03')))))) {
          DAT_00895e9b = '\x01';
          DAT_00895e7e = DAT_00895e82;
        }
        goto LAB_00438264;
      }
    }
    else {
      if ((DAT_00895e7a & 0x20000) != 0) {
        DAT_00895e9b = '\x01';
        DAT_00895e7e = DAT_00895e86;
      }
      if (uVar10 != 0) {
        if ((DAT_00895e7a & 0x40000) != 0) {
          DAT_00895e9b = '\x01';
          DAT_00895e7e = DAT_00895e86;
        }
        goto LAB_0043820d;
      }
LAB_00438264:
      if (((uVar10 != 0) && ((uVar4 & 0x80000) != 0)) &&
         ((iVar7 = FUN_00508f70(unit_land_array[DAT_00895e82]), iVar7 != 0 &&
          (((*(byte *)(iVar7 + 0x6d) & 1) != 0 &&
           ((game_state.tribes_array[iVar6].field_0xc23 & 0x80) != 0)))))) {
        DAT_00895e9b = '\x01';
        DAT_00895e7e = DAT_00895e82;
      }
    }
    if (((uVar1 & 0x800) != 0) && ((uVar4 & 1) != 0)) {
      DAT_00895e9b = '\x01';
      iVar7 = *(char *)((int)game_state.tribes_array[iVar6].field1341_0x8bf + 1) * 0x10;
      DAT_00895e7e = (int)(char)(&DAT_00895e04)[iVar7] << 8 | (int)(char)(&DAT_00895e05)[iVar7];
    }
    if ((uVar1 & 0x200) != 0) {
      if (((uVar4 & 4) != 0) && (unit_land_array[DAT_00895e86]->tribe_index != player_tribe_num)) {
        DAT_00895e9b = '\x01';
        DAT_00895e7e = DAT_00895e86;
      }
      if (((DAT_00895e9b == '\0') && ((uVar4 & 0x20) != 0)) && ((uVar4 & 0x80) == 0)) {
        DAT_00895e9b = '\x01';
        DAT_00895e7e = DAT_00895e82;
      }
    }
    switch(uVar9) {
    case 3:
      bStack_d = (byte)(DAT_00895e8e >> 8) & 0xfe;
      local_8 = ((DAT_00895e8e & 0xfe) + 1) * 0x100;
      uVar3 = CONCAT22(sStack_6,local_8);
      sStack_6 = (bStack_d + 1) * 0x100;
      local_4 = calc_point_height(uVar3,CONCAT22(local_4,sStack_6));
      if ((game_state.tribes_array[player_tribe_num].field_0x93d & 0x20) == 0) {
        cVar5 = FUN_00518200(&local_8,1);
        if (cVar5 != '\0') {
          if (cVar5 == '\x04') {
            if ((game_state.tribes_array[iVar6].field_0x93d & 0x40) == 0) {
              DAT_00895e9b = '\0';
            }
          }
          else {
            DAT_00895e9b = '\0';
          }
        }
      }
      else {
        cVar5 = FUN_00518200(&local_8,0);
        if (cVar5 != '\0') {
          DAT_00895e9b = '\0';
        }
      }
      break;
    case 6:
      if (((uVar4 & 2) == 0) || ((uVar4 & 0x80) == 0)) {
        DAT_00895e9b = '\0';
      }
      break;
    case 7:
      if ((uVar4 & 8) == 0) {
        DAT_00895e9b = '\0';
      }
      else {
        puVar8 = (unit_struct *)0x0;
        if ((((short)DAT_00895e86 != 0) &&
            (puVar2 = unit_land_array[DAT_00895e86 & 0xffff], (*(byte *)&puVar2->flags_2 & 1) == 0))
           && (puVar2->unit_class != '\0')) {
          puVar8 = puVar2;
        }
        if (puVar8 == (unit_struct *)0x0) {
          DAT_00895e7e = 0;
        }
        else if ((unit_type_array_scenery[(byte)puVar8->unit_type].flags_1 & 0x10) == 0) {
          DAT_00895e7e = 2;
        }
        else {
          DAT_00895e7e = 1;
        }
      }
      break;
    case 8:
      if (((uVar4 & 0x20) == 0) || ((uVar4 & 0x80) == 0)) {
        DAT_00895e9b = '\0';
      }
      break;
    case 10:
      if (((uVar4 & 0x60) == 0) || ((uVar4 & 0x80) == 0)) {
        DAT_00895e9b = '\0';
      }
      break;
    case 0xb:
      if ((uVar4 & 0x1000) == 0) {
        DAT_00895e9b = '\0';
      }
      else if ((uVar4 & 0x800000) == 0) {
        DAT_00895e9b = '\0';
      }
      break;
    case 0xd:
      if ((uVar4 & 8) == 0) {
        DAT_00895e9b = '\0';
      }
      break;
    case 0xf:
      if (((uVar4 & 0x62) == 0) || ((uVar4 & 0x80) != 0)) {
        DAT_00895e9b = '\0';
      }
      break;
    case 0x11:
      if ((uVar4 & 0xa2) != 0) {
        DAT_00895e9b = '\0';
      }
      break;
    case 0x14:
      if ((uVar4 & 0x200) == 0) {
        DAT_00895e9b = '\0';
      }
      break;
    case 0x16:
      if ((uVar4 & 0x400) == 0) {
        DAT_00895e9b = '\0';
      }
      break;
    case 0x1a:
      DAT_00895e9b = '\0';
      break;
    case 0x1b:
      if ((uVar4 & 0x800) == 0) {
        DAT_00895e9b = '\0';
      }
    }
    break;
  case 0x10:
    if (DAT_005cae80 == -1) break;
    DAT_00895e7e = (uint)DAT_005cae80;
    goto LAB_00438613;
  case 0x17:
    DAT_00895e9b = '\x01';
    break;
  case 0x22:
    if (DAT_005cae74 == 0) break;
    DAT_00895e7e = (uint)DAT_005cae74;
LAB_00438613:
    DAT_00895e9b = '\x01';
  }
  iVar6 = FUN_0044b060();
  if (((iVar6 != 0) && (uVar9 != 0x10)) && (uVar9 != 0x22)) {
    DAT_00895e9b = '\0';
  }
  return DAT_00895e9b;
}
