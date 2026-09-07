/* Ghidra 12.1.3 pseudocode; entry 004f0f90; FUN_004f0f90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f0f90(int param_1,undefined1 *param_2)

{
  byte bVar1;
  char cVar2;
  short sVar3;
  bool bVar4;
  int iVar5;
  undefined1 uVar6;

  iVar5 = 0;
  uVar6 = 0;
  bVar4 = false;
  switch(*(undefined1 *)(param_1 + 0x2a)) {
  case 1:
    iVar5 = (int)*(short *)(unit_type_array_person + *(byte *)(param_1 + 0x2b));
    sVar3 = *(short *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x2;
    if (sVar3 != 0) {
      if (((byte)land_flags_1 & 8) == 0) {
        if (*(char *)(param_1 + 0x2f) != player_tribe_num) {
          iVar5 = (int)sVar3;
          uVar6 = 1;
        }
      }
      else {
        iVar5 = sVar3 + 1;
        uVar6 = 1;
      }
    }
    break;
  case 2:
    bVar1 = *(byte *)(param_1 + 0x2b);
    if (bVar1 == 0x12) {
      bVar4 = true;
    }
    else {
      sVar3 = *(short *)&unit_type_array_building[bVar1].field_0x6;
      iVar5 = (int)*(short *)&unit_type_array_building[bVar1].field_0x4;
      if (sVar3 != 0) {
        if (((byte)land_flags_1 & 8) == 0) {
          if (*(char *)(param_1 + 0x2f) != player_tribe_num) {
            iVar5 = (int)sVar3;
            uVar6 = 1;
          }
        }
        else {
          iVar5 = sVar3 + 1;
          uVar6 = 1;
        }
      }
    }
    break;
  case 4:
    iVar5 = (int)*(short *)&unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x6;
    break;
  case 5:
    iVar5 = (int)unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].field1_0x2;
    if (*(byte *)(param_1 + 0x2b) == 9) {
      bVar4 = true;
    }
    break;
  case 10:
    if (*(char *)(param_1 + 0x2b) == '\x10') {
      iVar5 = 0x350;
    }
  }
  if (bVar4) {
    iVar5 = FUN_00508f70(param_1);
    if (iVar5 == 0) {
      iVar5 = 0;
    }
    else {
      cVar2 = *(char *)(param_1 + 0x8b);
      if (cVar2 == '\x01') {
        iVar5 = 0x37b;
      }
      else if (cVar2 == '\x02') {
        iVar5 = 0x37c;
      }
      else if (cVar2 == '\x03') {
        iVar5 = 0x37d;
      }
      else if (*(char *)(iVar5 + 0x68) == '\x03') {
        iVar5 = 0x379;
      }
      else if (*(char *)(iVar5 + 0x68) == '\x05') {
        iVar5 = 899;
      }
      else if ((*(byte *)(iVar5 + 0x6d) & 0x20) == 0) {
        iVar5 = (-(uint)((*(byte *)(iVar5 + 0x6d) & 0x10) == 0) & 0xfffffff7) + 0x381;
      }
      else {
        iVar5 = 0x382;
      }
    }
  }
  *param_2 = uVar6;
  return iVar5;
}
