/* Ghidra 12.1.3 pseudocode; entry 004a7860; FUN_004a7860.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a7860(int param_1,int param_2,int param_3)

{
  char cVar1;
  char cVar2;
  uint uVar3;
  short sVar4;
  int iVar5;
  int local_4;

  uVar3 = 0;
  iVar5 = 0;
  cVar1 = *(char *)(param_1 + 0x2a);
  local_4 = 0;
  if (cVar1 == '\x01') {
    iVar5 = (int)*(short *)(param_1 + 0x78);
  }
  else if (cVar1 == '\x05') {
    iVar5 = (int)*(short *)(param_1 + 0x84);
  }
  else if (cVar1 == '\t') {
    iVar5 = (int)*(short *)(param_1 + 0x96);
  }
  if (param_3 < iVar5) {
    iVar5 = param_3;
  }
  cVar2 = *(char *)(param_2 + 0x2a);
  if (cVar2 == '\x01') {
    sVar4 = *(short *)(param_2 + 0x78);
    uVar3 = (uint)(short)unit_type_array_person[*(byte *)(param_2 + 0x2b)].wood;
  }
  else {
    if (cVar2 == '\x02') {
      if ((unit_type_array_building[*(byte *)(param_2 + 0x2b)].field_0x48 & 0x40) != 0) {
        local_4 = (int)*(short *)(param_2 + 0xa4);
        uVar3 = (uint)*(short *)&unit_type_array_vehicle
                                 [(byte)unit_type_array_building[*(byte *)(param_2 + 0x2b)].
                                        unit_type1].field_0x13;
      }
      goto LAB_004a7950;
    }
    if (cVar2 != '\t') goto LAB_004a7950;
    uVar3 = (uint)*(ushort *)&unit_type_array_building[*(byte *)(param_2 + 0x9e)].field_0x1a;
    sVar4 = *(short *)(param_2 + 0x96);
  }
  local_4 = (int)sVar4;
LAB_004a7950:
  if ((int)(uVar3 - local_4) < iVar5) {
    iVar5 = uVar3 - local_4;
  }
  if (0 < iVar5) {
    sVar4 = (short)iVar5;
    if (cVar1 == '\x01') {
      *(short *)(param_1 + 0x78) = *(short *)(param_1 + 0x78) - sVar4;
    }
    else if (cVar1 == '\x05') {
      FUN_004a79f0(param_1,-iVar5,(int)*(char *)(param_2 + 0x2f));
    }
    else if (cVar1 == '\t') {
      FUN_004ba2c0(param_1,-iVar5);
    }
    cVar1 = *(char *)(param_2 + 0x2a);
    if (cVar1 == '\x01') {
      *(short *)(param_2 + 0x78) = *(short *)(param_2 + 0x78) + sVar4;
      return;
    }
    if (cVar1 == '\x02') {
      *(short *)(param_2 + 0xa4) = *(short *)(param_2 + 0xa4) + sVar4;
      return;
    }
    if (cVar1 != '\t') {
      return;
    }
    FUN_004ba2c0(param_2,iVar5);
  }
  return;
}
