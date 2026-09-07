/* Ghidra 12.1.3 pseudocode; entry 004627f0; FUN_004627f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004627f0(int param_1,uint param_2,undefined4 param_3)

{
  byte bVar1;
  int iVar2;
  int iVar3;
  byte *pbVar4;
  uint *puVar5;
  byte *pbVar6;

  if ((*(uint *)(param_1 + 0x59a) & 1 << ((byte)param_2 & 0x1f)) == 0) {
    return 0;
  }
  switch(param_2) {
  case 0:
    iVar2 = FUN_004f67b0(param_1);
    iVar3 = FUN_004f5d20(param_1,param_3);
    if (iVar3 <= iVar2) {
      return 1;
    }
    break;
  case 1:
    iVar3 = 0;
    puVar5 = (uint *)(param_1 + 0x74);
    iVar2 = 10;
    do {
      if (((*puVar5 & 1) != 0) && (*(char *)((int)puVar5 + 0x11) == '\x01')) {
        iVar3 = iVar3 + 1;
      }
      puVar5 = (uint *)((int)puVar5 + 0x52);
      iVar2 = iVar2 + -1;
    } while (iVar2 != 0);
    if (iVar3 < 2) {
      return 1;
    }
    break;
  case 2:
    iVar2 = 0;
    pbVar6 = (byte *)(param_1 + 0x74);
    iVar3 = 10;
    do {
      if (((*pbVar6 & 1) != 0) && (pbVar6[0x11] == 2)) {
        iVar2 = iVar2 + 1;
      }
      pbVar6 = pbVar6 + 0x52;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
    if (iVar2 < 1) {
      return 1;
    }
    break;
  case 3:
    iVar2 = 0;
    pbVar4 = (byte *)(param_1 + 0x74);
    iVar3 = 10;
    pbVar6 = pbVar4;
    do {
      if (((*pbVar6 & 1) != 0) && (pbVar6[0x11] == param_2)) {
        iVar2 = iVar2 + 1;
      }
      pbVar6 = pbVar6 + 0x52;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
    if (iVar2 < 1) {
      iVar3 = 0;
      iVar2 = 10;
      do {
        if ((*pbVar4 & 1) != 0) {
          iVar3 = iVar3 + 1;
        }
        pbVar4 = pbVar4 + 0x52;
        iVar2 = iVar2 + -1;
      } while (iVar2 != 0);
      if (4 < 10 - iVar3) {
        return 1;
      }
    }
    break;
  case 4:
    iVar3 = 0;
    pbVar6 = (byte *)(param_1 + 0x74);
    iVar2 = 10;
    do {
      if (((*pbVar6 & 1) != 0) && (pbVar6[0x11] == param_2)) {
        iVar3 = iVar3 + 1;
      }
      pbVar6 = pbVar6 + 0x52;
      iVar2 = iVar2 + -1;
    } while (iVar2 != 0);
    if (iVar3 < 1) {
      return 1;
    }
    break;
  case 5:
    iVar2 = 0;
    pbVar4 = (byte *)(param_1 + 0x74);
    iVar3 = 10;
    pbVar6 = pbVar4;
    do {
      if (((*pbVar6 & 1) != 0) && (pbVar6[0x11] == param_2)) {
        iVar2 = iVar2 + 1;
      }
      pbVar6 = pbVar6 + 0x52;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
    if (iVar2 < 1) {
      iVar3 = 0;
      iVar2 = 10;
      do {
        if ((*pbVar4 & 1) != 0) {
          iVar3 = iVar3 + 1;
        }
        pbVar4 = pbVar4 + 0x52;
        iVar2 = iVar2 + -1;
      } while (iVar2 != 0);
      if (4 < 10 - iVar3) {
        return 1;
      }
    }
    break;
  case 6:
    return 1;
  case 7:
    iVar2 = 0;
    pbVar6 = (byte *)(param_1 + 0x74);
    iVar3 = 10;
    do {
      if (((*pbVar6 & 1) != 0) && (pbVar6[0x11] == param_2)) {
        iVar2 = iVar2 + 1;
      }
      pbVar6 = pbVar6 + 0x52;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
    if (iVar2 < 1) {
      return 1;
    }
    break;
  case 8:
    iVar3 = 0;
    pbVar6 = (byte *)(param_1 + 0x74);
    iVar2 = 10;
    do {
      if (((*pbVar6 & 1) != 0) && (pbVar6[0x11] == param_2)) {
        iVar3 = iVar3 + 1;
      }
      pbVar6 = pbVar6 + 0x52;
      iVar2 = iVar2 + -1;
    } while (iVar2 != 0);
    if (iVar3 < (int)(uint)*(byte *)((int)game_state.start_n1 +
                                    *(char *)(param_1 + 0xc22) * 0x30 + -0x21)) {
      return 1;
    }
    break;
  case 9:
    iVar2 = 0;
    pbVar6 = (byte *)(param_1 + 0x74);
    iVar3 = 10;
    do {
      if (((*pbVar6 & 1) != 0) && (pbVar6[0x11] == param_2)) {
        iVar2 = iVar2 + 1;
      }
      pbVar6 = pbVar6 + 0x52;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
    if (iVar2 < 1) {
      return 1;
    }
    break;
  case 0xb:
    iVar2 = 0;
    pbVar6 = (byte *)(param_1 + 0x74);
    iVar3 = 10;
    pbVar4 = pbVar6;
    do {
      if (((*pbVar4 & 1) != 0) && (pbVar4[0x11] == param_2)) {
        iVar2 = iVar2 + 1;
      }
      pbVar4 = pbVar4 + 0x52;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
    if ((iVar2 < 1) && (0 < *(short *)(param_1 + 0xa2f))) {
      iVar3 = 0;
      iVar2 = 10;
      do {
        if ((*pbVar6 & 1) != 0) {
          iVar3 = iVar3 + 1;
        }
        pbVar6 = pbVar6 + 0x52;
        iVar2 = iVar2 + -1;
      } while (iVar2 != 0);
      if (4 < 10 - iVar3) {
        return 1;
      }
    }
    break;
  case 0xd:
    iVar3 = 0;
    pbVar6 = (byte *)(param_1 + 0x74);
    iVar2 = 10;
    do {
      if (((*pbVar6 & 1) != 0) && (pbVar6[0x11] == param_2)) {
        iVar3 = iVar3 + 1;
      }
      pbVar6 = pbVar6 + 0x52;
      iVar2 = iVar2 + -1;
    } while (iVar2 != 0);
    if ((iVar3 < (int)(uint)*(byte *)((int)game_state.start_n1 +
                                     *(char *)(param_1 + 0xc22) * 0x30 + -0x19)) &&
       (0 < *(short *)(param_1 + 0xa31))) {
      return 1;
    }
    break;
  case 0xe:
    iVar2 = 0;
    pbVar6 = (byte *)(param_1 + 0x74);
    iVar3 = 10;
    do {
      if (((*pbVar6 & 1) != 0) && (pbVar6[0x11] == param_2)) {
        iVar2 = iVar2 + 1;
      }
      pbVar6 = pbVar6 + 0x52;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
    if (iVar2 < 1) {
      return 1;
    }
    break;
  case 0xf:
    iVar2 = FUN_00462d40(param_1,param_2);
    if ((iVar2 < 1) && ((0 < *(short *)(param_1 + 0xa33) || (0 < *(short *)(param_1 + 0xa2d))))) {
      iVar3 = 0;
      pbVar6 = (byte *)(param_1 + 0x74);
      iVar2 = 10;
      do {
        if ((*pbVar6 & 1) != 0) {
          iVar3 = iVar3 + 1;
        }
        pbVar6 = pbVar6 + 0x52;
        iVar2 = iVar2 + -1;
      } while (iVar2 != 0);
      if (4 < 10 - iVar3) {
        return 1;
      }
    }
    break;
  case 0x10:
    iVar2 = FUN_00462d40(param_1,param_2);
    if (iVar2 < 1) {
      iVar3 = 0;
      pbVar6 = (byte *)(param_1 + 0x74);
      iVar2 = 10;
      do {
        if ((*pbVar6 & 1) != 0) {
          iVar3 = iVar3 + 1;
        }
        pbVar6 = pbVar6 + 0x52;
        iVar2 = iVar2 + -1;
      } while (iVar2 != 0);
      if (4 < 10 - iVar3) {
        return 1;
      }
    }
    break;
  case 0x11:
    iVar2 = FUN_00462d40(param_1,param_2);
    if (iVar2 < 1) {
      return 1;
    }
    break;
  case 0x12:
    iVar2 = FUN_00462d40(param_1,param_2);
    if (iVar2 < 1) {
      return 1;
    }
    break;
  case 0x13:
    iVar2 = FUN_00462d40(param_1,param_2);
    if (iVar2 < 1) {
      return 1;
    }
    break;
  case 0x14:
    bVar1 = *(byte *)((int)game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0x30 + -0x17);
    iVar2 = FUN_00462d40(param_1,param_2);
    if (iVar2 < (int)(uint)bVar1) {
      return 1;
    }
  }
  return 0;
}
