/* Ghidra 12.1.3 pseudocode; entry 0050c840; FUN_0050c840.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050c840(int param_1)

{
  uint *puVar1;
  char cVar2;
  bool bVar3;
  byte bVar4;
  int iVar5;
  int iVar6;
  uint uVar7;
  ushort uVar8;
  int *piVar9;
  undefined4 local_33c;
  short local_338;
  int local_334;
  short local_330;
  ushort local_32e;
  int local_32c;
  int local_328;
  undefined *local_324;
  int local_320;
  ushort local_31c [398];

  local_334 = param_1;
  iVar6 = 0;
  bVar3 = false;
  local_324 = &DAT_0089d1c8 + *(char *)(param_1 + 0x2f) * 0xc65;
  if (*(char *)(param_1 + 0x2d) == '\0') {
    *(undefined2 *)(param_1 + 0x72) = 0xa0;
    local_33c = *(uint *)(param_1 + 0x3d);
    uVar8 = 0;
    *(undefined2 *)(param_1 + 0x74) = 0xa0;
    local_338 = *(short *)(param_1 + 0x41) + 200;
    do {
      iVar5 = FUN_004ed8a0(7,0x3c,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
      if (iVar5 != 0) {
        *(short *)(iVar5 + 0x41) = *(short *)(param_1 + 0x41) + -0x28;
        if ((*(byte *)(iVar5 + 0xe) & 0x10) == 0) {
          FUN_004ed6f0(iVar5);
          *(undefined1 *)(iVar5 + 0x2c) = 0xb;
        }
        if (iVar6 % 5 == 0) {
          FUN_004010b0(iVar5,1,1,0);
        }
        *(ushort *)(iVar5 + 0x57) = uVar8;
        uVar7 = *(uint *)(iVar5 + 0x14);
        *(uint *)(iVar5 + 0x14) = uVar7 | 0x100;
        *(uint *)(iVar5 + 0x14) = uVar7 | 0x300;
        *(undefined2 *)(local_334 + 0x6e) = *(undefined2 *)(iVar5 + 0x24);
        local_334 = iVar5;
      }
      iVar6 = iVar6 + 1;
      uVar8 = uVar8 + 0x40 & 0x7ff;
    } while (iVar6 < 0x20);
  }
  puVar1 = (uint *)(param_1 + 0x3d);
  local_334 = (int)*(short *)(param_1 + 0x72) * (int)*(short *)(param_1 + 0x72);
  FUN_0049c7a0(puVar1,&local_320,&local_328);
  local_32c = 0;
  if (0 < local_328) {
    piVar9 = &local_320;
    do {
      uVar8 = *(ushort *)(piVar9 + 1);
      local_330 = (uVar8 & 0xfe) << 8;
      local_338 = 0;
      local_32e = uVar8 & 0xfe00;
      local_33c = CONCAT22(uVar8,local_330) & 0xfe00ffff;
      iVar6 = FUN_00450450(puVar1,&local_330);
      if (iVar6 <= local_334) {
        if (*(short *)(*piVar9 + 4) != *(short *)(param_1 + 0x41)) {
          FUN_0044fde0(*piVar9,*(short *)(param_1 + 0x41),0x80,1);
        }
        for (iVar6 = (&DAT_00890390)[*(short *)(*piVar9 + 6)]; iVar6 != 0;
            iVar6 = (&DAT_00890390)[*(ushort *)(iVar6 + 0x20)]) {
          cVar2 = *(char *)(iVar6 + 0x2a);
          if (cVar2 == '\x01') {
            if (*(char *)(iVar6 + 0x2f) == -1) {
              if ((*(char *)(iVar6 + 0x2b) == '\x01') && ((*(byte *)(param_1 + 0x76) & 1) != 0)) {
                FUN_004d7fd0(iVar6,CONCAT31(0xff,*(undefined1 *)(param_1 + 0x2f)),iVar6 + 0x3d);
                FUN_004ed8a0(7,0x3a,*(undefined1 *)(param_1 + 0x2f),iVar6 + 0x3d);
              }
            }
            else if (((((*(byte *)(param_1 + 0x76) & 2) != 0) &&
                      (*(char *)(param_1 + 0x2f) != *(char *)(iVar6 + 0x2f))) &&
                     (1 < *(byte *)(iVar6 + 0x2b))) &&
                    ((*(byte *)(iVar6 + 0x2b) < 7 && (*(char *)(iVar6 + 0x2c) != '\x1a')))) {
              if ((*(byte *)(iVar6 + 0xe) & 0x10) == 0) {
                *(char *)(iVar6 + 0x7d) = *(char *)(iVar6 + 0x2c);
                FUN_004ed6f0(iVar6);
                *(undefined1 *)(iVar6 + 0x2c) = 0x1a;
                FUN_004ed640(iVar6);
              }
              FUN_004da080(iVar6,CONCAT31((int3)((uint)*(byte *)(iVar6 + 0x2b) * 5 >> 8),
                                          *(undefined1 *)(param_1 + 0x2f)),
                           *(uint *)(&DAT_005a7070 + (uint)*(byte *)(iVar6 + 0x2b) * 0x32) >> 1,0);
            }
          }
          else if (cVar2 == '\x05') {
            if ((((*(uint *)(&DAT_005a79c4 + (uint)*(byte *)(iVar6 + 0x2b) * 0x18) & 0x200) == 0) &&
                (bVar3 = true, (*(byte *)(iVar6 + 0x90) & 4) == 0)) &&
               ((*(uint *)(&DAT_005a79c4 + (uint)*(byte *)(iVar6 + 0x2b) * 0x18) & 0x20) != 0)) {
              FUN_004ed8a0(7,5,CONCAT31((int3)((uint)*(byte *)(iVar6 + 0x2b) * 3 >> 8),
                                        *(undefined1 *)(param_1 + 0x2f)),&local_33c);
            }
          }
          else if ((cVar2 == '\a') && (*(char *)(iVar6 + 0x2b) == '\x12')) {
            FUN_004ef180(iVar6);
          }
        }
      }
      piVar9 = piVar9 + 2;
      local_32c = local_32c + 1;
    } while (local_32c < local_328);
  }
  if (*(byte *)(param_1 + 0x2d) < 0x10) {
    *(short *)(param_1 + 0x72) = *(short *)(param_1 + 0x72) + 0xa0;
    *(short *)(param_1 + 0x74) = *(short *)(param_1 + 0x74) + 0xa0;
  }
  if (*(short *)(param_1 + 0x72) < 0) {
    *(undefined2 *)(param_1 + 0x72) = 0;
  }
  if (0xa00 < *(short *)(param_1 + 0x72)) {
    *(undefined2 *)(param_1 + 0x72) = 0xa00;
  }
  if (*(short *)(param_1 + 0x74) < 0) {
    *(undefined2 *)(param_1 + 0x74) = 0;
  }
  if (0x800 < *(short *)(param_1 + 0x74)) {
    *(undefined2 *)(param_1 + 0x74) = 0x800;
  }
  uVar7 = (&DAT_00890390)[*(ushort *)(param_1 + 0x6e)];
  if (DAT_00890390 < uVar7) {
    do {
      iVar6 = FUN_004ed8a0(7,0x3d,*(undefined1 *)(param_1 + 0x2f),uVar7 + 0x3d);
      if (iVar6 != 0) {
        *(undefined2 *)(iVar6 + 0x41) = *(undefined2 *)(uVar7 + 0x41);
        *(undefined2 *)(iVar6 + 0x5f) = 0x30;
        *(undefined2 *)(iVar6 + 0x57) = *(undefined2 *)(uVar7 + 0x57);
      }
      *(ushort *)(uVar7 + 0x57) = *(short *)(uVar7 + 0x57) + 0x5bU & 0x7ff;
      local_33c = *puVar1;
      local_338 = *(short *)(param_1 + 0x41);
      FUN_004e6a70(&local_33c,CONCAT22((short)(local_33c >> 0x10),*(undefined2 *)(uVar7 + 0x57)),
                   CONCAT22((short)((uint)&local_33c >> 0x10),*(undefined2 *)(param_1 + 0x74)));
      *(short *)(uVar7 + 0x43) = (short)local_33c - *(short *)(uVar7 + 0x3d);
      *(short *)(uVar7 + 0x45) = local_33c._2_2_ - *(short *)(uVar7 + 0x3f);
      FUN_004ee580(uVar7,&local_33c);
      uVar7 = (&DAT_00890390)[*(ushort *)(uVar7 + 0x6e)];
    } while (DAT_00890390 < uVar7);
  }
  bVar4 = *(char *)(param_1 + 0x2d) + 1;
  *(byte *)(param_1 + 0x2d) = bVar4;
  if (0x14 < bVar4) {
    uVar7 = (&DAT_00890390)[*(ushort *)(param_1 + 0x6e)];
    if (DAT_00890390 < uVar7) {
      do {
        FUN_004edcf0(uVar7);
        uVar7 = (&DAT_00890390)[*(ushort *)(uVar7 + 0x6e)];
      } while (DAT_00890390 < uVar7);
    }
    *(undefined2 *)(param_1 + 0x6e) = 0;
    if (!bVar3) {
      *(uint *)(local_324 + 0x93d) = *(uint *)(local_324 + 0x93d) & 0xfffffffe;
      FUN_004edcf0(param_1);
    }
  }
  return;
}
