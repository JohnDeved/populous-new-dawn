/* Ghidra 12.1.3 pseudocode; entry 00463780; unit_processing_class_4_vehicle.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_processing_class_4_vehicle(int param_1)

{
  char cVar1;
  byte bVar2;
  int iVar3;
  uint uVar4;
  int iVar5;
  undefined2 *puVar6;
  short sVar7;
  short local_4;
  short local_2;

  if ((*(byte *)(param_1 + 0x15) & 2) == 0) {
    local_4 = *(short *)(param_1 + 0x26);
    local_2 = *(short *)(param_1 + 0x41);
  }
  if (*(char *)(param_1 + 0xa3) != '\0') {
    *(char *)(param_1 + 0xa3) = *(char *)(param_1 + 0xa3) + -1;
  }
  FUN_004ebec0(param_1);
  iVar3 = *(byte *)(param_1 + 0x2c) - 1;
  switch(iVar3) {
  case 0:
    if ((*(byte *)(param_1 + 0xc) & 4) != 0) {
      *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 0x8000;
    }
    if ((*(uint *)(param_1 + 0x92) & 0x8000) != 0) {
      *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) & 0xffff7fff;
      if ((unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15 & 1) == 0) {
        FUN_004e7fb0();
      }
      else {
        FUN_004e8f00(param_1);
      }
      *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 2;
    }
    if (*(short *)(param_1 + 0x9a) != 0) {
      *(short *)(param_1 + 0x9a) = *(short *)(param_1 + 0x9a) + -1;
    }
    FUN_00463e80(param_1);
    FUN_00466d90(param_1);
    break;
  case 1:
    if ((*(byte *)(param_1 + 0xc) & 4) != 0) {
      *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 0x8000;
    }
    if ((*(uint *)(param_1 + 0x92) & 0x8000) != 0) {
      *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) & 0xffff7fff;
      if ((unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15 & 1) == 0) {
        FUN_004e7fb0();
      }
      else {
        FUN_004e8f00(param_1);
      }
      *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 2;
    }
    if (*(short *)(param_1 + 0x9a) != 0) {
      *(short *)(param_1 + 0x9a) = *(short *)(param_1 + 0x9a) + -1;
    }
    FUN_00463e80(param_1);
    FUN_00466d90(param_1);
    break;
  case 2:
    FUN_00463f20(param_1);
    break;
  case 3:
    FUN_004641d0(param_1);
    break;
  case 4:
    cVar1 = FUN_0044f980(param_1 + 0x3d);
    if (cVar1 == '\0') {
      if (*(ushort *)(param_1 + 0x6c) < 0x18e) {
        *(ushort *)(param_1 + 0x6c) = *(ushort *)(param_1 + 0x6c) + 8;
      }
      sVar7 = *(short *)(param_1 + 0x41) + -8;
      *(short *)(param_1 + 0x41) = sVar7;
      if (sVar7 < -0xbf) {
        FUN_004ef180(param_1);
      }
    }
    else {
      FUN_00407860(param_1,0,0,0xffffffff,0,(*(byte *)(param_1 + 0x94) & 0x40) != 0,0xffffffff,
                   0xffffffff,0);
      iVar3 = alloc_unit(7,1,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
      if (iVar3 != 0) {
        FUN_0050b6f0(iVar3,3,2,5,0x62,0x8c,1,0);
      }
      FUN_004ef180(param_1);
      if ((unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15 & 1) == 0) {
        FUN_0048a050(iVar3,0x4d,0);
      }
      else {
        FUN_0048a050(iVar3,0x4c,0);
      }
    }
    break;
  case 5:
    sVar7 = *(short *)(param_1 + 0x41) + 0x50;
    *(short *)(param_1 + 0x41) = sVar7;
    if (0x3ff < sVar7) {
      FUN_00407860(param_1,0,0,0xffffffff,0,
                   CONCAT31((int3)(CONCAT22((short)((uint)iVar3 >> 0x10),sVar7) >> 8),
                            (*(byte *)(param_1 + 0x94) & 0x40) != 0),0xffffffff,0xffffffff,0);
      iVar3 = alloc_unit(7,1,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
      if (iVar3 != 0) {
        FUN_0050b6f0(iVar3,3,2,5,0x62,0x8c,1,0);
      }
      FUN_004ef180(param_1);
      if ((unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15 & 1) == 0) {
        FUN_0048a050(iVar3,0x4d,0);
      }
      else {
        FUN_0048a050(iVar3,0x4c,0);
      }
    }
    break;
  case 6:
    FUN_00464480(param_1);
    break;
  case 7:
    FUN_004648a0(param_1);
    break;
  case 8:
    FUN_004649b0(param_1);
  }
  FUN_00466be0(param_1);
  FUN_00463cb0(param_1);
  if (((*(byte *)(param_1 + 0x94) & 1) == 0) &&
     ((unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15 & 1) != 0)) {
    bVar2 = *(byte *)(param_1 + 0x2e) & 0xf;
    uVar4 = (uint)bVar2;
    if (8 < bVar2) {
      uVar4 = 0x10 - uVar4;
    }
    sVar7 = (short)(uVar4 * 0x80 + ((int)(uVar4 * 0x80) >> 0x1f & 0xffU) >> 8);
    if ((*(byte *)(param_1 + 0x2e) & 0x10) != 0) {
      sVar7 = -sVar7;
    }
    *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + sVar7;
    puVar6 = (undefined2 *)(param_1 + 0x7a);
    iVar3 = (int)(char)unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x8;
    if (0 < iVar3) {
      do {
        iVar5 = FUN_004077e0(*puVar6);
        if (iVar5 != 0) {
          *(short *)(iVar5 + 0x41) = *(short *)(iVar5 + 0x41) + sVar7;
        }
        puVar6 = puVar6 + 1;
        iVar3 = iVar3 + -1;
      } while (iVar3 != 0);
    }
  }
  uVar4 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar4 & 0xfffffffb;
  *(uint *)(param_1 + 0xc) = uVar4 & 0xffffdffb;
  if ((*(byte *)(param_1 + 0x15) & 2) != 0) {
    return;
  }
  sVar7 = *(short *)(param_1 + 0x26) - local_4;
  *(short *)(param_1 + 0x28) = sVar7;
  if (sVar7 < 0x401) {
    if (-0x401 < sVar7) goto LAB_00463b61;
    sVar7 = sVar7 + 0x800;
  }
  else {
    sVar7 = sVar7 + -0x800;
  }
  *(short *)(param_1 + 0x28) = sVar7;
LAB_00463b61:
  *(short *)(param_1 + 0x47) = *(short *)(param_1 + 0x41) - local_2;
  return;
}
