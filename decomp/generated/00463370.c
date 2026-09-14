/* Ghidra 12.1.3 pseudocode; entry 00463370; init_unit_class_4.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_class_4(int param_1)

{
  char cVar1;
  byte bVar2;
  uint uVar3;
  short sVar4;
  ushort uVar5;
  uint uVar6;
  int iVar7;
  int iVar8;
  undefined2 *puVar9;
  undefined4 local_8;
  undefined1 local_4 [4];

  uVar5 = *(ushort *)(param_1 + 0x35);
  uVar3 = *(uint *)(param_1 + 0x92);
  *(ushort *)(param_1 + 0x35) = uVar5 | 0x20;
  uVar6 = *(uint *)(param_1 + 0x14) & 0xffdfffff;
  *(uint *)(param_1 + 0x92) = uVar3 & 0xfffeffff;
  *(uint *)(param_1 + 0x14) = uVar6;
  switch(*(undefined1 *)(param_1 + 0x2c)) {
  case 1:
    *(ushort *)(param_1 + 0x35) = uVar5 | 0x20;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(uint *)(param_1 + 0x92) = uVar3 & 0xfffefffe;
    *(uint *)(param_1 + 0x92) = uVar3 & 0xfffefefe;
    *(undefined1 *)(param_1 + 0x9f) = 0;
    *(uint *)(param_1 + 0x92) = uVar3 & 0xfffefefe | 0x4000;
    FUN_00463750(param_1 + 0x3d);
    FUN_00466e90(param_1);
    *(undefined2 *)(param_1 + 0x43) = 0;
    *(undefined2 *)(param_1 + 0x47) = 0;
    *(undefined2 *)(param_1 + 0x45) = 0;
    break;
  case 2:
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(undefined1 *)(param_1 + 0x9f) = 0;
    sVar4 = calc_point_height(CONCAT22((short)((uVar3 & 0xfffeffff) >> 0x10),
                                       *(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22((short)(uVar6 >> 0x10),*(undefined2 *)(param_1 + 0x3f)));
    *(short *)(param_1 + 0x41) =
         *(short *)&unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].z + sVar4;
    FUN_00466e90(param_1);
    *(undefined2 *)(param_1 + 0x43) = 0;
    *(undefined2 *)(param_1 + 0x47) = 0;
    *(undefined2 *)(param_1 + 0x45) = 0;
    break;
  case 3:
    *(ushort *)(param_1 + 0x35) = uVar5 | 0x20;
    *(uint *)(param_1 + 0x92) = uVar3 & 0xfffefffe;
    *(undefined2 *)(param_1 + 0x9c) = 0;
    *(uint *)(param_1 + 0x92) = uVar3 & 0xfffefefe;
    if ((uVar3 & 0x80) == 0) {
      uVar5 = *(short *)(param_1 + 0x26) + 0x400U & 0x7ff;
    }
    else {
      uVar5 = *(ushort *)(param_1 + 0x26);
      *(uint *)(param_1 + 0x92) = uVar3 & 0xfffefe7e;
    }
    *(ushort *)(param_1 + 0x5d) = uVar5;
    FUN_00463750(param_1 + 0x3d);
    FUN_00466e90(param_1);
    break;
  case 4:
    *(ushort *)(param_1 + 0x35) = uVar5 | 0x20;
    *(undefined2 *)(param_1 + 0x5d) = *(undefined2 *)(param_1 + 0x26);
    iVar8 = (int)(char)unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x8;
    if ((*(char *)(param_1 + 0x9e) != '\0') && (0 < iVar8)) {
      puVar9 = (undefined2 *)(param_1 + 0x7a);
      do {
        iVar7 = FUN_004077e0(*puVar9);
        if (iVar7 != 0) {
          FUN_004d3ea0(iVar7);
        }
        puVar9 = puVar9 + 1;
        iVar8 = iVar8 + -1;
      } while (iVar8 != 0);
    }
    break;
  case 5:
    *(ushort *)(param_1 + 0x35) = uVar5 & 0xffdf;
    *(uint *)(param_1 + 0x14) = uVar6 | 0x200000;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    FUN_00466190(param_1,local_4);
    cVar1 = *(char *)(param_1 + 0x9e);
    while (cVar1 != '\0') {
      iVar8 = FUN_004659d0(param_1,0,local_4);
      if (iVar8 != 0) {
        local_8 = *(undefined4 *)(iVar8 + 0x3d);
        FUN_00432520(iVar8,&local_8);
        FUN_00402e70(iVar8,&local_8);
        *(uint *)(iVar8 + 0xc) = *(uint *)(iVar8 + 0xc) | 0x10;
      }
      cVar1 = *(char *)(param_1 + 0x9e);
    }
    *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 0x10000;
    break;
  case 6:
    *(undefined2 *)(param_1 + 0x5f) = 0;
    FUN_00466190(param_1,local_4);
    cVar1 = *(char *)(param_1 + 0x9e);
    while (cVar1 != '\0') {
      iVar8 = FUN_004659d0(param_1,0,local_4);
      if (iVar8 != 0) {
        local_8 = *(undefined4 *)(iVar8 + 0x3d);
        FUN_00432520(iVar8,&local_8);
        FUN_00402e70(iVar8,&local_8);
        *(uint *)(iVar8 + 0xc) = *(uint *)(iVar8 + 0xc) | 0x10;
      }
      cVar1 = *(char *)(param_1 + 0x9e);
    }
    *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 0x10000;
    break;
  case 8:
    FUN_00464710(param_1);
    break;
  case 9:
    *(undefined2 *)(param_1 + 0x5f) = 0;
    FUN_00466190(param_1,local_4);
    cVar1 = *(char *)(param_1 + 0x9e);
    while (cVar1 != '\0') {
      iVar8 = FUN_004659d0(param_1,0,local_4);
      if (iVar8 != 0) {
        local_8 = *(undefined4 *)(iVar8 + 0x3d);
        FUN_00432520(iVar8,&local_8);
        FUN_00402e70(iVar8,&local_8);
        *(uint *)(iVar8 + 0xc) = *(uint *)(iVar8 + 0xc) | 0x10;
      }
      cVar1 = *(char *)(param_1 + 0x9e);
    }
    uVar3 = *(uint *)(param_1 + 0x92);
    *(uint *)(param_1 + 0x92) = uVar3 | 0x10000;
    *(uint *)(param_1 + 0x92) = uVar3 | 0x30000;
    bVar2 = unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15;
    *(undefined2 *)(param_1 + 0x9a) = 10;
    if ((bVar2 & 1) != 0) {
      *(undefined2 *)(param_1 + 0x9a) = 2;
    }
  }
  if ((((*(char *)(param_1 + 0x2b) == '\x01') || (*(char *)(param_1 + 0x2b) == '\x02')) &&
      (*(char *)(param_1 + 0x2c) != '\x03')) && ((*(byte *)(param_1 + 0x10) & 0x10) != 0)) {
    FUN_0048a770(0x4f,param_1);
  }
  if (((*(char *)(param_1 + 0x2b) == '\x03') || (*(char *)(param_1 + 0x2b) == '\x04')) &&
     ((*(char *)(param_1 + 0x2c) != '\x04' && ((*(byte *)(param_1 + 0x10) & 0x10) != 0)))) {
    FUN_0048a770(0x4e,param_1);
  }
  return;
}
