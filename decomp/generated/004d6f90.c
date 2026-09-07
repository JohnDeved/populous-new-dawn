/* Ghidra 12.1.3 pseudocode; entry 004d6f90; FUN_004d6f90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d6f90(int param_1)

{
  short *psVar1;
  undefined2 *puVar2;
  bool bVar3;
  ushort uVar4;
  char cVar5;
  byte bVar6;
  byte bVar7;
  char cVar8;
  undefined1 uVar9;
  short sVar10;
  uint uVar11;
  int iVar12;
  uint uVar13;
  undefined4 uVar14;
  char local_18;
  char cStack_17;
  byte bStack_14;
  byte bStack_13;
  undefined2 uStack_12;
  undefined2 local_10;
  undefined4 local_c;
  uint local_8;
  undefined1 local_4 [4];

  if (*(short *)(param_1 + 0x9f) == 0) {
    bVar3 = true;
    if ((((unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x31 & 4) != 0) &&
        (psVar1 = (short *)(param_1 + 0x3d), uVar11 = (int)*(short *)(param_1 + 0x68) - (int)*psVar1
        , uVar13 = (int)uVar11 >> 0x1f, (int)((uVar11 ^ uVar13) - uVar13) < 0x238)) &&
       (uVar11 = (int)*(short *)(param_1 + 0x6a) - (int)*(short *)(param_1 + 0x3f),
       uVar13 = (int)uVar11 >> 0x1f, (int)((uVar11 ^ uVar13) - uVar13) < 0x238)) {
      cVar5 = FUN_00518200(psVar1,0);
      if (cVar5 == '\0') {
        bVar3 = false;
        *(undefined2 *)(param_1 + 0x5f) = 0;
        FUN_004d3ff0(param_1,(*(short *)(param_1 + 0x78) == 0) - 1U & 4);
        *(undefined4 *)(param_1 + 0x68) = *(undefined4 *)psVar1;
      }
    }
    if (bVar3) {
      bVar3 = false;
      puVar2 = (undefined2 *)(param_1 + 0x68);
      bVar7 = (byte)((ushort)*puVar2 >> 8);
      bStack_14 = bVar7 & 0xfe;
      bVar6 = (byte)((ushort)*(undefined2 *)(param_1 + 0x6a) >> 8);
      bStack_13 = bVar6 & 0xfe;
      uVar4 = CONCAT11(bVar6,bVar7) & 0xfefe;
      bVar7 = get_empty_indexed_xy(2,0,0,0x20);
      local_8 = (uint)bVar7;
      if (local_8 != 0) {
        do {
          cVar5 = get_indexed_xy(local_8,&local_c,local_4);
          if (cVar5 == '\0') break;
          local_18 = (char)uVar4;
          cStack_17 = (char)(uVar4 >> 8);
          FUN_004d72d0(CONCAT13(bStack_13,
                                CONCAT12(bStack_14,
                                         CONCAT11(local_4[0] * '\x02' + cStack_17,
                                                  (char)local_c * '\x02' + local_18))),&bStack_14);
          cVar5 = FUN_00518200(&bStack_14,0);
          if (cVar5 == '\0') {
            bVar3 = true;
          }
        } while (!bVar3);
        clear_indexed_xy(local_8);
      }
      if (bVar3) {
        *puVar2 = CONCAT11(bStack_13,bStack_14);
        *(undefined2 *)(param_1 + 0x6a) = uStack_12;
      }
      FUN_004e9d80(param_1,puVar2);
    }
    uVar11 = *(uint *)(param_1 + 0xc);
    if ((uVar11 & 0x800000) == 0) {
      if (*(char *)(param_1 + 0x2b) == '\x04') {
        uVar14 = 0x11;
        sVar10 = FUN_00436c20();
        if (sVar10 != 0) {
          local_c = *(undefined4 *)(param_1 + 0x68);
          if ((*(byte *)(param_1 + 0xe) & 0x80) != 0) {
            iVar12 = get_adjacent_unit(param_1,4);
            if (iVar12 != 0) {
              uVar14 = 0x1f;
              get_building_coords(iVar12,&local_c);
            }
          }
          bStack_14 = (byte)local_c;
          bStack_13 = (byte)((uint)local_c >> 8);
          uStack_12 = (undefined2)((uint)local_c >> 0x10);
          FUN_00438730(sVar10,uVar14,&bStack_14,0);
          iVar12 = FUN_004f2480(param_1);
          if (iVar12 == 0) {
            *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 1;
          }
          FUN_00436ca0(param_1);
          FUN_00436d00(param_1,sVar10,0);
          FUN_004e9b40(param_1);
          if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
            *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
            uVar9 = FUN_00402e30(param_1);
            empty_unit_function(param_1);
            *(undefined1 *)(param_1 + 0x2c) = uVar9;
            init_unit_class(param_1);
            return;
          }
        }
      }
      else {
        cVar5 = '\0';
        if (((*(char *)(param_1 + 0x7e) == '\0') &&
            (((*(ushort *)(param_1 + 0x3d) ^ *(ushort *)(param_1 + 0x4f)) & 0xfe00) == 0)) &&
           (cVar5 = '\0',
           ((*(ushort *)(param_1 + 0x51) ^ *(ushort *)(param_1 + 0x3f)) & 0xfe00) == 0)) {
          cVar5 = '\x13';
        }
        if (((uVar11 & 0x2004) != 0) ||
           (((*(byte *)(param_1 + 0x2e) & 0xf) == 0 && ((uVar11 & 0x800) != 0)))) {
          uStack_12 = *(undefined2 *)(param_1 + 0x6a);
          bStack_14 = (byte)*(undefined2 *)(param_1 + 0x68);
          bStack_13 = (byte)((ushort)*(undefined2 *)(param_1 + 0x68) >> 8);
          local_10 = 0;
          cVar8 = FUN_00518200(&bStack_14,0);
          if (cVar8 != '\0') {
            *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10;
          }
        }
        if ((cVar5 != '\0') && ((*(byte *)(param_1 + 0xe) & 0x10) == 0)) {
          *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
          empty_unit_function(param_1);
          *(undefined1 *)(param_1 + 0x2c) = 0x13;
          init_unit_class(param_1);
          return;
        }
      }
    }
    else if ((uVar11 & 0x100000) == 0) {
      *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 0x15;
      init_unit_class(param_1);
      return;
    }
  }
  else if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x1e;
    init_unit_class(param_1);
  }
  return;
}
