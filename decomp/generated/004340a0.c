/* Ghidra 12.1.3 pseudocode; entry 004340a0; FUN_004340a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_004340a0(int param_1,int param_2)

{
  byte bVar1;
  undefined2 uVar2;
  unit_struct *puVar3;
  bool bVar4;
  bool bVar5;
  short sVar6;
  uint uVar7;
  int iVar8;
  unit_struct *puVar9;
  uint uVar10;
  ushort *puVar11;
  undefined4 uVar12;
  char local_d;
  undefined1 local_c [4];
  undefined2 local_8;
  undefined2 local_6;
  undefined2 local_4;

  local_d = '\0';
  if (*(char *)(param_1 + 0x2d) == '\0') {
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) == 0) {
      if ((*(byte *)(param_1 + 0x2e) & 1) != 0) goto LAB_00434122;
    }
    else {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      FUN_004d4f40(param_1);
    }
    uVar7 = (int)*(short *)(param_2 + 6) - (int)*(short *)(param_1 + 0x3d);
    uVar10 = (int)uVar7 >> 0x1f;
    if (((int)((uVar7 ^ uVar10) - uVar10) < 0x838) &&
       (uVar7 = (int)*(short *)(param_2 + 8) - (int)*(short *)(param_1 + 0x3f),
       uVar10 = (int)uVar7 >> 0x1f, (int)((uVar7 ^ uVar10) - uVar10) < 0x838)) {
      *(undefined1 *)(param_1 + 0x2d) = 1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
  }
LAB_00434122:
  if (*(char *)(param_1 + 0x2d) == '\x01') {
    iVar8 = 0;
    bVar1 = *(byte *)(param_2 + 1);
    if ((bVar1 & 4) == 0) {
      if ((bVar1 & 8) != 0) goto LAB_00434149;
    }
    else {
      if ((bVar1 & 8) == 0) {
        uVar12 = 1;
      }
      else {
LAB_00434149:
        if ((bVar1 & 4) != 0) goto LAB_00434160;
        uVar12 = 2;
      }
      iVar8 = FUN_004a74e0(param_1,param_2 + 6,0,8,uVar12);
    }
LAB_00434160:
    if ((iVar8 == 0) && (iVar8 = FUN_004a74e0(param_1,param_2 + 6,0,8,0), iVar8 == 0)) {
      local_d = '\x01';
      *(undefined2 *)(param_1 + 0x72) = 0;
    }
    else {
      uVar2 = *(undefined2 *)(iVar8 + 0x24);
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      *(undefined2 *)(param_1 + 0x72) = uVar2;
      *(undefined1 *)(param_1 + 0x2d) = 2;
    }
  }
  switch(*(byte *)(param_1 + 0x2d) - 2) {
  case 0:
    puVar9 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0x72) != 0) &&
        (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x72)], (*(byte *)&puVar3->flags_2 & 1) == 0
        )) && (puVar3->unit_class != '\0')) {
      puVar9 = puVar3;
    }
    if (puVar9 == (unit_struct *)0x0) {
      *(undefined1 *)(param_1 + 0x2d) = 1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
    else {
      if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
        FUN_004d4f40(param_1);
        FUN_004e9d80(param_1,&puVar9->pos);
      }
      if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
        uVar7 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
        uVar10 = (int)uVar7 >> 0x1f;
        if ((0x6f < (int)((uVar7 ^ uVar10) - uVar10)) ||
           (uVar7 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
           uVar10 = (int)uVar7 >> 0x1f, bVar4 = true, 0x6f < (int)((uVar7 ^ uVar10) - uVar10))) {
          bVar4 = false;
        }
        if (bVar4) {
          *(undefined1 *)(param_1 + 0x2d) = 3;
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        }
      }
    }
    break;
  case 1:
    puVar9 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0x72) != 0) &&
        (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x72)], (*(byte *)&puVar3->flags_2 & 1) == 0
        )) && (puVar3->unit_class != '\0')) {
      puVar9 = puVar3;
    }
    if (puVar9 == (unit_struct *)0x0) {
      *(undefined1 *)(param_1 + 0x2d) = 1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return local_d;
    }
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfff7;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      FUN_004d50d0(param_1);
      FUN_0048a050(param_1,1,0x10);
      if (puVar9->unit_type == '\v') {
        *(undefined2 *)(param_1 + 0x70) = 3;
      }
      else {
        *(ushort *)(param_1 + 0x70) =
             (ushort)(byte)unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x1d;
      }
    }
    iVar8 = 0;
    sVar6 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar6;
    if (0 < sVar6) {
      if (puVar9->unit_type != '\v') {
        return local_d;
      }
      FUN_0048a050(param_1,10,0);
      return local_d;
    }
    FUN_004a7860(puVar9,param_1,(int)(short)unit_type_array_person[*(byte *)(param_1 + 0x2b)].wood);
    bVar4 = false;
    uVar7 = (uint)*(byte *)(param_1 + 0xa6);
    puVar11 = (ushort *)(param_1 + 0x8d + uVar7 * 2);
    do {
      uVar7 = uVar7 + 1;
      if (7 < (int)uVar7) break;
      if ((*puVar11 != 0) &&
         ((*(byte *)((int)(game_state.sunlight_array + 0x32) + (uint)*puVar11 * 10 + 1) & 1) == 0))
      {
        bVar4 = true;
        break;
      }
      iVar8 = iVar8 + 1;
      puVar11 = puVar11 + 1;
    } while (iVar8 < 8);
    if (!bVar4) {
      *(undefined1 *)(param_1 + 0x2d) = 4;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return local_d;
    }
    goto LAB_004345e4;
  case 2:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      if (*(short *)(param_2 + 4) == 0) {
        local_4 = 0;
        local_8 = *(undefined2 *)(param_2 + 6);
        local_6 = *(undefined2 *)(param_2 + 8);
        iVar8 = alloc_unit(10,0x12,*(undefined1 *)(param_1 + 0x2f),&local_8);
        if (iVar8 != 0) {
          *(undefined2 *)(param_2 + 4) = *(undefined2 *)(iVar8 + 0x24);
        }
      }
      puVar9 = (unit_struct *)0x0;
      if (((*(ushort *)(param_2 + 4) != 0) &&
          (puVar3 = unit_land_array[*(ushort *)(param_2 + 4)], (*(byte *)&puVar3->flags_2 & 1) == 0)
          ) && (puVar3->unit_class != '\0')) {
        puVar9 = puVar3;
      }
      if ((puVar9 == (unit_struct *)0x0) || (iVar8 = FUN_005034e0(puVar9,param_1), iVar8 == 0)) {
        local_d = '\x01';
      }
      else {
        *(undefined2 *)(param_1 + 0x72) = *(undefined2 *)(iVar8 + 0x24);
        FUN_004d4f40(param_1);
        if (*(char *)(iVar8 + 0x2a) == '\t') {
          FUN_004b9fc0();
        }
        else {
          FUN_004044b0(iVar8,local_c);
        }
        FUN_004e9d80(param_1,local_c);
      }
    }
    puVar9 = (unit_struct *)0x0;
    if (local_d == '\0') {
      bVar4 = false;
      if (((*(ushort *)(param_1 + 0x72) != 0) &&
          (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x72)],
          (*(byte *)&puVar3->flags_2 & 1) == 0)) && (puVar3->unit_class != '\0')) {
        puVar9 = puVar3;
      }
      if (puVar9 == (unit_struct *)0x0) {
        bVar4 = true;
      }
      else {
        if (((*(byte *)(param_1 + 0x2e) & 0xf) == 0) &&
           (iVar8 = FUN_0040b4f0(puVar9,0,0,0,0), iVar8 < 1)) {
          bVar4 = true;
        }
        if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
          uVar7 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
          uVar10 = (int)uVar7 >> 0x1f;
          if ((0x6f < (int)((uVar7 ^ uVar10) - uVar10)) ||
             (uVar7 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
             uVar10 = (int)uVar7 >> 0x1f, bVar5 = true, 0x6f < (int)((uVar7 ^ uVar10) - uVar10))) {
            bVar5 = false;
          }
          if (bVar5) {
            *(undefined1 *)(param_1 + 0x2d) = 5;
            *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
          }
        }
      }
      if (bVar4) {
        puVar9 = (unit_struct *)0x0;
        if (((*(ushort *)(param_2 + 4) != 0) &&
            (puVar3 = unit_land_array[*(ushort *)(param_2 + 4)],
            (*(byte *)&puVar3->flags_2 & 1) == 0)) && (puVar3->unit_class != '\0')) {
          puVar9 = puVar3;
        }
        if (puVar9 != (unit_struct *)0x0) {
          puVar9->field_0x66 = 1;
        }
        *(undefined1 *)(param_1 + 0x2d) = 4;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
    }
    break;
  case 3:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      FUN_004d58c0(param_1,0);
      FUN_004d3ff0(param_1,(-(uint)(*(short *)(param_1 + 0x78) == 0) & 0xfffffffc) + 5);
      puVar9 = (unit_struct *)0x0;
      if (((*(ushort *)(param_1 + 0x72) != 0) &&
          (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x72)],
          (*(byte *)&puVar3->flags_2 & 1) == 0)) && (puVar3->unit_class != '\0')) {
        puVar9 = puVar3;
      }
      if (puVar9 != (unit_struct *)0x0) {
        FUN_00409dd0(puVar9,local_c);
        FUN_004e9d80(param_1,local_c);
      }
    }
    if ((*(byte *)(param_1 + 0x2e) & 1) != 0) {
      return local_d;
    }
    uVar7 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar10 = (int)uVar7 >> 0x1f;
    if ((0x6f < (int)((uVar7 ^ uVar10) - uVar10)) ||
       (uVar7 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar10 = (int)uVar7 >> 0x1f, bVar4 = true, 0x6f < (int)((uVar7 ^ uVar10) - uVar10))) {
      bVar4 = false;
    }
    if (!bVar4) {
      return local_d;
    }
LAB_004345e4:
    local_d = '\x01';
  }
  return local_d;
}
