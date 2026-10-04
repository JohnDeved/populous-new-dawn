/* Ghidra 12.1.3 pseudocode; entry 004fdbc0; FUN_004fdbc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004fdbc0(void)

{
  char cVar1;
  wchar_t wVar2;
  wchar_t wVar3;
  int iVar4;
  uint uVar5;
  wchar_t *pwVar6;
  wchar_t *_Source;
  uint local_210;
  wchar_t local_200 [256];

  if ((DAT_0089c669._3_1_ & 0x80) != 0) {
    DAT_005d570c = (&DAT_005ddde8)[DAT_005d5dd8 & 0x7ff] * 0xff >> 0x10;
    iVar4 = 1;
    if (DAT_005ca850 != 0) {
      iVar4 = DAT_005ca850;
    }
    DAT_005d5dd8 = DAT_005d5dd8 + (int)(1000 / (longlong)iVar4);
    local_210 = DAT_005d570c;
    if (0x200 < DAT_005d5dd8) {
      DAT_005d5dd8 = 0x200;
    }
  }
  pwVar6 = DAT_0059df0c;
  if (DAT_0059df0c < DAT_00a69058) {
    do {
      wVar2 = *pwVar6;
      wVar3 = pwVar6[1];
      _Source = (wchar_t *)((int)pwVar6 + 7);
      uVar5 = (uint)(byte)pwVar6[2];
      cVar1 = *(char *)((int)pwVar6 + 5);
      iVar4 = FUN_0055b680();
      pwVar6 = _Source + iVar4 + 1U;
      _wcsncpy(local_200,_Source,iVar4 + 1U);
      if (*(int *)(&DAT_005d5b20 + uVar5 * 0x30) != 0) goto LAB_004fdfe8;
      if ((DAT_0089c669._3_1_ & 0x80) == 0) {
        if ((uVar5 == 0) && (cVar1 != -1)) {
          if (((DAT_005fc9f4._1_1_ & 1) == 0) || (iVar4 = FUN_00493210(), iVar4 != 0)) {
            iVar4 = FUN_00493210();
            if (iVar4 == 0) {
              FUN_00516d30();
              DAT_0098489c = cVar1;
            }
            else {
              FUN_00451b40();
              DAT_0098489c = cVar1;
            }
          }
          else {
            FUN_004297c0();
            DAT_0098489c = cVar1;
          }
        }
        else if (((DAT_005fc9f4._1_1_ & 1) == 0) || (iVar4 = FUN_00493210(), iVar4 != 0)) {
          iVar4 = FUN_00493210();
          if (iVar4 == 0) {
            FUN_00516d30();
          }
          else {
            FUN_00451b40();
          }
        }
        else {
          FUN_004297c0();
        }
      }
      else {
        switch(uVar5) {
        case 1:
        case 2:
        case 3:
        case 4:
          if (((DAT_005fc9f4._1_1_ & 1) == 0) || (iVar4 = FUN_00493210(), iVar4 != 0)) {
            iVar4 = FUN_00493210();
            if (iVar4 == 0) {
LAB_004fdd9e:
              FUN_00516d30();
            }
            else {
              FUN_00451b40();
            }
          }
          else {
            FUN_004297c0();
          }
          break;
        default:
          if (((DAT_005fc9f4._1_1_ & 1) == 0) || (iVar4 = FUN_00493210(), iVar4 != 0)) {
            iVar4 = FUN_00493210();
            if (iVar4 == 0) {
              FUN_00516d30();
            }
            else {
              FUN_00451b40();
            }
          }
          else {
            FUN_004297c0();
          }
          DAT_0098489c = cVar1;
          if (cVar1 == -1) {
            DAT_0098489c = -0x14;
          }
          break;
        case 6:
        case 7:
        case 8:
        case 9:
          if (((DAT_005fc9f4._1_1_ & 1) == 0) || (iVar4 = FUN_00493210(), iVar4 != 0)) {
            iVar4 = FUN_00493210();
            if (iVar4 == 0) goto LAB_004fdd9e;
            FUN_00451b40();
          }
          else {
            FUN_004297c0();
          }
        }
        iVar4 = FUN_00493210();
        if (iVar4 == 0) {
          DAT_005da074 = DAT_005da074 | 8;
          switch(uVar5) {
          case 1:
          case 6:
            DAT_005d570c = (local_210 * 2) / 3;
            break;
          default:
            DAT_005d570c = local_210;
            break;
          case 4:
          case 9:
            DAT_005d570c = local_210 / 3;
          }
        }
      }
      iVar4 = FUN_00493210();
      if (iVar4 == 0) {
        iVar4 = FUN_00493210();
        if (iVar4 == 0) goto LAB_004fdfbb;
        FUN_00451ba0(wVar2,wVar3);
        goto LAB_004fdfd3;
      }
      switch(uVar5) {
      case 1:
      case 3:
      case 4:
        DAT_0098489c = DAT_0089c6f4;
        if (DAT_0088f000 != '\x02') {
          DAT_0098489c = -0x14;
        }
        break;
      case 2:
        goto joined_r0x004fdf29;
      case 6:
      case 8:
      case 9:
        DAT_0098489c = DAT_0089c6f4;
        if (DAT_0088f000 != '\x02') {
          DAT_0098489c = -0x14;
        }
        break;
      case 7:
joined_r0x004fdf29:
        DAT_0098489c = DAT_0089c6f4;
        if (DAT_0088f000 == '\x02') {
          DAT_0098489c = DAT_0089c6f6;
        }
      }
      if (DAT_0059d104 == 0) {
        DAT_0098489c = DAT_0089c6f5;
      }
      iVar4 = FUN_00493210();
      if (iVar4 == 0) {
LAB_004fdfbb:
        FUN_00415f70(DAT_0098489c);
        FUN_00527960(wVar2,wVar3,local_200);
      }
      else {
        FUN_00451ba0(wVar2,wVar3);
      }
LAB_004fdfd3:
      DAT_005da074 = DAT_005da074 & 0xffffffe3;
LAB_004fdfe8:
    } while (pwVar6 < DAT_00a69058);
  }
  if ((DAT_0089c669._3_1_ & 0x80) != 0) {
    DAT_005d570c = 0x55;
  }
  return;
}
