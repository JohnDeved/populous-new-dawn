/* Ghidra 12.1.3 pseudocode; entry 00491810; FUN_00491810.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00491810(undefined4 param_1,int param_2)

{
  short sVar1;
  int iVar2;
  ushort *puVar3;
  int iVar4;
  uint *puVar5;
  short *psVar6;
  uint uVar7;
  int local_4;

  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  iVar4 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  iVar2 = *(int *)(param_2 + 0x3104);
  psVar6 = (short *)(iVar2 + 2);
  *(short **)(param_2 + 0x3104) = psVar6;
  sVar1 = *psVar6;
  if (sVar1 == 0x3fe) {
    local_4 = 1;
  }
  else if (sVar1 == 0x3ff) {
    local_4 = 0;
  }
  *(int *)(param_2 + 0x3104) = iVar2 + 4;
  uVar7 = (uint)*(ushort *)(&DAT_005ae448 + iVar4 * 2);
  if ((0x10 < iVar4) && (iVar4 < 0x24)) {
    switch(uVar7) {
    case 0xd:
      uVar7 = 1;
      break;
    case 0xe:
      uVar7 = 2;
      break;
    case 0xf:
      uVar7 = 3;
      break;
    case 0x10:
      uVar7 = 4;
      break;
    case 0x11:
      uVar7 = 5;
      break;
    case 0x12:
      uVar7 = 6;
      break;
    case 0x13:
      uVar7 = 7;
      break;
    case 0x14:
      uVar7 = 8;
      break;
    case 0x15:
      uVar7 = 9;
      break;
    case 0x16:
      uVar7 = 10;
      break;
    case 0x17:
      uVar7 = 0xb;
      break;
    case 0x18:
      uVar7 = 0xc;
      break;
    case 0x19:
      uVar7 = 0xd;
      break;
    case 0x1a:
      uVar7 = 0xe;
      break;
    case 0x1b:
      uVar7 = 0xf;
      break;
    case 0x1c:
      uVar7 = 0x11;
      break;
    case 0x1d:
      uVar7 = 0x10;
      break;
    case 0x1e:
      uVar7 = 0x12;
      break;
    case 0x1f:
      uVar7 = 0x13;
      break;
    case 0x20:
      uVar7 = 0x14;
      break;
    case 0x21:
      uVar7 = 0x15;
    }
    puVar5 = (uint *)FUN_0044bd80(uVar7);
    uVar7 = 0xffffffff;
    if (puVar5 != (uint *)0x0) {
      uVar7 = *puVar5;
    }
  }
  if (uVar7 != 0xffffffff) {
    if (local_4 != 0) {
      DAT_0068c6c9 = (char)uVar7;
      return;
    }
    DAT_0068c6c9 = 0xff;
  }
  return;
}
