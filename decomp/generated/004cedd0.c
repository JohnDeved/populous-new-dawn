/* Ghidra 12.1.3 pseudocode; entry 004cedd0; FUN_004cedd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004cedd0(int param_1,int param_2)

{
  int *piVar1;
  char *pcVar2;
  byte bVar3;
  byte bVar4;
  byte bVar5;
  undefined2 uVar6;
  short sVar7;
  ushort uVar8;
  unit_struct *puVar9;
  char cVar10;
  byte bVar11;
  ushort uVar12;
  uint uVar13;
  int iVar14;
  char cVar15;
  undefined2 extraout_var;
  ushort *puVar16;
  undefined4 uVar17;
  ushort uVar18;
  int local_4;

  piVar1 = (int *)(param_2 * 0x52 + 0x36 + param_1);
  switch(*(undefined2 *)((int)piVar1 + 0x42)) {
  case 0:
    piVar1[1] = 0;
    *(undefined1 *)(piVar1 + 10) = 0;
    *(undefined2 *)((int)piVar1 + 0x42) = 2;
    sVar7 = *(short *)((int)piVar1 + (uint)*(byte *)((int)piVar1 + 0x29) * 2 + 0x10);
    if (sVar7 == -1) {
      uVar13 = 0xffffffff;
    }
    else {
      uVar13 = (uint)(ushort)level_hdr_mem.pos_array[sVar7];
    }
    iVar14 = FUN_004f3880(param_1,level_hdr_mem.pos_array
                                  [*(short *)((int)piVar1 +
                                             (uint)*(byte *)((int)piVar1 + 0x29) * 2 + 8)],uVar13);
    uVar13 = (uint)*(byte *)((int)piVar1 + 0x29);
    if ((int)((uint)*(byte *)((int)piVar1 + uVar13 + 0x24) +
              (uint)*(byte *)(uVar13 + 0x18 + (int)piVar1) +
              (uint)*(byte *)((int)piVar1 + uVar13 + 0x1c) +
             (uint)*(byte *)((int)piVar1 + uVar13 + 0x20)) <= iVar14) {
      *(undefined2 *)((int)piVar1 + 0x42) = 6;
      return;
    }
    if (iVar14 != 0) {
      do {
        pcVar2 = (char *)(*(byte *)((int)piVar1 + 0x29) + 0x18 + (int)piVar1);
        cVar10 = *pcVar2;
        if (cVar10 == '\0') break;
        iVar14 = iVar14 + -1;
        *pcVar2 = cVar10 + -1;
      } while (iVar14 != 0);
      if (iVar14 == 0) goto joined_r0x004ceed9;
      do {
        pcVar2 = (char *)(*(byte *)((int)piVar1 + 0x29) + 0x1c + (int)piVar1);
        cVar10 = *pcVar2;
        if (cVar10 == '\0') break;
        iVar14 = iVar14 + -1;
        *pcVar2 = cVar10 + -1;
      } while (iVar14 != 0);
    }
    if (iVar14 != 0) {
      do {
        pcVar2 = (char *)(*(byte *)((int)piVar1 + 0x29) + 0x20 + (int)piVar1);
        cVar10 = *pcVar2;
        if (cVar10 == '\0') break;
        iVar14 = iVar14 + -1;
        *pcVar2 = cVar10 + -1;
      } while (iVar14 != 0);
joined_r0x004ceed9:
      do {
        if (iVar14 == 0) break;
        pcVar2 = (char *)(*(byte *)((int)piVar1 + 0x29) + 0x24 + (int)piVar1);
        cVar10 = *pcVar2;
        if (cVar10 == '\0') break;
        iVar14 = iVar14 + -1;
        *pcVar2 = cVar10 + -1;
      } while( true );
    }
  case 2:
    FUN_004f5c80(param_1,piVar1,3);
    break;
  case 3:
    uVar17 = 0xffffffff;
    cVar10 = '\0';
    uVar13 = (uint)*(byte *)((int)piVar1 + 0x29);
    uVar6 = level_hdr_mem.pos_array[*(short *)((int)piVar1 + uVar13 * 2 + 8)];
    if (*(int *)((int)piVar1 + 0x32) == 1) {
      bVar11 = *(byte *)((int)piVar1 + uVar13 + 0x18);
      bVar3 = *(byte *)((int)piVar1 + uVar13 + 0x24);
      bVar4 = *(byte *)((int)piVar1 + uVar13 + 0x1c);
      iVar14 = *(int *)(param_1 + 0x881);
      bVar5 = *(byte *)((int)piVar1 + uVar13 + 0x20);
      while ((iVar14 != 0 &&
             (piVar1[1] < (int)((uint)bVar3 + (uint)bVar11 + (uint)bVar4 + (uint)bVar5)))) {
        if (((*(byte *)(iVar14 + 0x11) & 8) != 0) &&
           (((unit_type_related_1_ARRAY_005a6f78[*(byte *)(iVar14 + 0x2c)].field_0x1 & 8) != 0 &&
            (piVar1[1] = piVar1[1] + 1, (*(byte *)(iVar14 + 0xe) & 0x10) == 0)))) {
          *(undefined1 *)(iVar14 + 0x7d) = *(undefined1 *)(iVar14 + 0x2c);
          empty_unit_function(iVar14);
          *(undefined1 *)(iVar14 + 0x2c) = 0xe;
          init_unit_class(iVar14);
        }
        iVar14 = *(int *)(iVar14 + 8);
      }
      *(undefined1 *)(piVar1 + 10) = 5;
    }
    else {
      do {
        if (4 < *(byte *)(piVar1 + 10)) break;
        cVar15 = *(byte *)(piVar1 + 10) + 1;
        *(char *)(piVar1 + 10) = cVar15;
        switch(cVar15) {
        case '\x01':
          uVar17 = 2;
          cVar10 = *(char *)(*(byte *)((int)piVar1 + 0x29) + 0x18 + (int)piVar1);
          break;
        case '\x02':
          uVar17 = 3;
          cVar10 = *(char *)(*(byte *)((int)piVar1 + 0x29) + 0x1c + (int)piVar1);
          break;
        case '\x03':
          uVar17 = 6;
          cVar10 = *(char *)(*(byte *)((int)piVar1 + 0x29) + 0x20 + (int)piVar1);
          break;
        case '\x04':
          uVar17 = 4;
          cVar10 = *(char *)(*(byte *)((int)piVar1 + 0x29) + 0x24 + (int)piVar1);
        }
      } while (cVar10 == '\0');
      if (((cVar10 != '\0') &&
          (local_4 = FUN_004f8490(param_1,uVar17,uVar17,0xffffffff,1,uVar6,0x40,cVar10,&DAT_00a0d108
                                 ), local_4 != 0)) && (piVar1[1] = piVar1[1] + local_4, 0 < local_4)
         ) {
        puVar16 = &DAT_00a0d10a;
        do {
          puVar9 = unit_land_array[*puVar16];
          if ((*(byte *)((int)&puVar9->flags_2 + 2) & 0x10) == 0) {
            *(undefined1 *)((int)&puVar9->loc_1_y + 1) = puVar9->state;
            empty_unit_function(puVar9);
            puVar9->state = 0xe;
            init_unit_class(puVar9);
          }
          if (*(char *)((int)piVar1 + 0x2a) != '\0') {
            FUN_004f2440(puVar9,99);
          }
          puVar16 = puVar16 + 2;
          local_4 = local_4 + -1;
        } while (local_4 != 0);
      }
    }
    if ((char)piVar1[10] == '\x05') {
      if (piVar1[1] == 0) {
        *(undefined2 *)((int)piVar1 + 0x42) = 6;
        return;
      }
      *(undefined2 *)((int)piVar1 + 0x42) = 4;
      *(undefined1 *)(param_1 + 0x5b1) = 0x14;
      return;
    }
    break;
  case 4:
    FUN_004f5d10(param_1,piVar1,5);
    return;
  case 5:
    if (*(char *)((int)piVar1 + 0x2a) != '\0') {
      uVar18 = level_hdr_mem.pos_array
               [*(short *)((int)piVar1 + (uint)*(byte *)((int)piVar1 + 0x29) * 2 + 8)];
      uVar8 = (&game_state.level_data[0].unit_index_2)[((uVar18 & 0xfe) * 2 | uVar18 & 0xfe00) * 2];
      uVar12 = uVar8 & 0x3ff;
      if ((uVar8 & 0x3ff) == 0) {
        uVar12 = 0;
        uVar17 = 3;
      }
      else {
        uVar18 = 0;
        uVar17 = 8;
      }
      FUN_00435730(param_1,uVar17,uVar12,uVar18);
      FUN_004359b0(param_1,0xffffffff,0xffffffff,0xffffffff);
      FUN_00418ce0(param_1,0xe);
      FUN_004f6440(param_1,piVar1);
      *(undefined2 *)((int)piVar1 + 0x42) = 6;
      return;
    }
    bVar11 = *(byte *)((int)piVar1 + 0x29);
    if (*(short *)((int)piVar1 + (uint)bVar11 * 2 + 0x10) == -1) {
      iVar14 = *piVar1;
      if (iVar14 == -1) {
        iVar14 = CONCAT22(0xffff,level_hdr_mem.pos_array
                                 [*(short *)((int)piVar1 + (uint)bVar11 * 2 + 8)]);
      }
      FUN_00435730(param_1,3,0,iVar14);
      FUN_004359b0(param_1,4,0xffffffff,0xffffffff);
      FUN_0041b180(param_1,0xe,4,0xffffffff,0xffffffff);
      FUN_00435730(param_1,0xb,0x606,iVar14);
      FUN_004359b0(param_1,0xffffffff,0xffffffff,0xffffffff);
      FUN_00418ce0(param_1,0xe);
      FUN_004f6440(param_1,piVar1);
      *(undefined2 *)((int)piVar1 + 0x42) = 6;
      return;
    }
    sVar7 = *(short *)((int)piVar1 + (uint)bVar11 * 2 + 8);
    FUN_00435730(param_1,0xb,0x606,CONCAT22(sVar7 >> 0xf,level_hdr_mem.pos_array[sVar7]));
    FUN_00435730(param_1,0xb,0x606,
                 CONCAT22(extraout_var,
                          level_hdr_mem.pos_array
                          [*(short *)((int)piVar1 + (uint)*(byte *)((int)piVar1 + 0x29) * 2 + 0x10)]
                         ));
    FUN_004359b0(param_1,0xffffffff,0xffffffff,0xffffffff);
    FUN_00418ce0(param_1,0xe);
    FUN_004f6440(param_1,piVar1);
    *(undefined2 *)((int)piVar1 + 0x42) = 6;
    return;
  case 6:
    FUN_004f6840(param_1,piVar1);
    bVar11 = *(char *)((int)piVar1 + 0x29) + 1;
    *(byte *)((int)piVar1 + 0x29) = bVar11;
    if (3 < bVar11) {
      FUN_00462770(piVar1);
      return;
    }
    if (*(short *)((int)piVar1 + (uint)bVar11 * 2 + 8) == -1) {
      FUN_00462770(piVar1);
      return;
    }
    *(undefined2 *)((int)piVar1 + 0x42) = 0;
    return;
  }
  return;
}
