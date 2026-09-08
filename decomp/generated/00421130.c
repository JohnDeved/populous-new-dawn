/* Ghidra 12.1.3 pseudocode; entry 00421130; FUN_00421130.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

int FUN_00421130(void)

{
  undefined1 uVar1;
  char cVar2;
  int iVar3;
  uint *puVar4;
  uint uVar5;
  int *piVar6;
  int *piVar7;
  int iVar8;
  uint uVar9;
  int *piVar10;
  bool bVar11;
  uint local_40;
  uint local_3c;
  undefined2 local_38;
  int local_34;
  uint local_30;
  uint local_2c;
  int local_28;
  int local_24;
  uint local_20;
  uint local_1c;
  undefined2 local_18;
  short local_14;
  short local_12;
  int local_10;
  undefined4 local_c;
  uint local_8;
  undefined2 local_4;

  local_20 = _DAT_0065093a;
  local_1c = _DAT_0065093e;
  local_18 = _DAT_00650942;
  local_40 = _DAT_00650930;
  local_3c = _DAT_00650934;
  local_38 = _DAT_00650938;
  local_24 = 0;
  local_34 = 0;
  local_30 = 0;
  local_10 = DAT_0059bd8c;
  DAT_006513d8 = DAT_00650938;
  uVar1 = DAT_00650930;
  DAT_006513d7 = 0;
  _DAT_00651344 = 0;
  DAT_0064f484 = DAT_0064f484 + 1;
  *(short *)(&game_state.field_0xb863e + *(char *)(game_state._755280_4_ + 0x2f) * 2) =
       *(short *)(&game_state.field_0xb863e + *(char *)(game_state._755280_4_ + 0x2f) * 2) + 1;
  local_c._0_2_ = CONCAT11(DAT_00650934,uVar1);
  DAT_0064f4a4 = 0;
  uVar5 = ((ushort)local_c & 0xfe) * 2 | (ushort)local_c & 0xfe00;
  if (((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar5 * 4] & 0xf)) & 1)
       == 0) && (iVar3 = FUN_004665c0(uVar5 * 4 + 0x8a03e4), iVar3 != 0)) {
    DAT_0064f4a4 = iVar3;
  }
LAB_0042122f:
  DAT_0064f4a0 = 0;
  FUN_00421f30(&local_40,&local_20);
  do {
    iVar8 = DAT_006513c0;
    iVar3 = DAT_006513cc;
    if (DAT_006513c8 <= DAT_006513d0) {
      iVar8 = DAT_006513c4;
      iVar3 = -DAT_006513c8;
    }
    DAT_006513d0 = DAT_006513d0 + iVar3;
    if ((game_state._755277_1_ == '\0') ||
       ((game_state._755278_1_ != '\0' && ((char)local_38 != '\0')))) {
      DAT_006513d7 = 0;
    }
    else {
      DAT_006513d7 = 1;
    }
    cVar2 = FUN_00422020(&local_40,iVar8,&DAT_0064f4a0);
    if (cVar2 == '\0') {
      local_24 = local_24 + 1;
      if (DAT_006513dc != '\0') {
        iVar3 = _DAT_00651344 * 10;
        *(uint *)((int)&DAT_00650944 + iVar3) = local_40;
        *(uint *)((int)&DAT_00650948 + iVar3) = local_3c;
        *(undefined2 *)(&DAT_0065094c + iVar3) = local_38;
        _DAT_00651344 = _DAT_00651344 + 1;
        local_40 = local_40 + *(int *)(&DAT_0059bd90 + iVar8 * 10);
        local_3c = local_3c + *(int *)(&DAT_0059bd94 + iVar8 * 10);
        local_38 = CONCAT11(local_38._1_1_,(char)local_38 == '\0');
        iVar3 = _DAT_00651344 * 10;
        *(uint *)((int)&DAT_00650944 + iVar3) = local_40;
        *(uint *)((int)&DAT_00650948 + iVar3) = local_3c;
        *(undefined2 *)(&DAT_0065094c + iVar3) = local_38;
        _DAT_00651344 = _DAT_00651344 + 1;
        bVar11 = (uint)(int)(short)game_state._755270_2_ <= _DAT_00651344;
        goto joined_r0x0042175b;
      }
      local_40 = local_40 + *(int *)(&DAT_0059bd90 + iVar8 * 10);
      local_3c = local_3c + *(int *)(&DAT_0059bd94 + iVar8 * 10);
    }
    else {
      iVar3 = _DAT_00651344 * 10;
      *(uint *)((int)&DAT_00650944 + iVar3) = local_40;
      *(uint *)((int)&DAT_00650948 + iVar3) = local_3c;
      *(undefined2 *)(&DAT_0065094c + iVar3) = local_38;
      _DAT_00651344 = _DAT_00651344 + 1;
      local_30 = (uint)((uint)(int)(short)game_state._755270_2_ <= _DAT_00651344);
      if (local_30 != 0) goto LAB_004218f7;
      _DAT_0064f488 = _DAT_0064f488 + 1;
      local_2c = local_2c & 0xffffff00;
      local_c = local_40;
      local_8 = local_3c;
      local_4 = local_38;
      if (((char)local_38 != '\0') && ((char)local_18 == '\0')) {
        uVar5 = local_3c & 0xfffffffe;
        uVar9 = local_40 & 0xfffffffe;
        local_14 = (ushort)((byte)local_40 & 0xfe) << 8;
        local_12 = (ushort)((byte)local_3c & 0xfe) << 8;
        cVar2 = FUN_00464f90(DAT_0064f4a4,&local_14);
        if (cVar2 != '\0') {
          iVar3 = 0;
          puVar4 = &DAT_00651370;
          do {
            if ((*puVar4 == uVar9) && (puVar4[1] == uVar5)) {
              local_2c = CONCAT31(local_2c._1_3_,1);
              break;
            }
            iVar3 = iVar3 + 1;
            puVar4 = (uint *)((int)puVar4 + 10);
          } while (iVar3 < 8);
        }
      }
      if ((char)local_2c != '\0') {
        iVar3 = _DAT_00651344 * 10;
        *(uint *)((int)&DAT_00650944 + iVar3) = local_40;
        local_34 = 1;
        *(uint *)((int)&DAT_00650948 + iVar3) = local_3c;
        *(undefined2 *)(&DAT_0065094c + iVar3) = local_38;
        _DAT_00651344 = _DAT_00651344 + 1;
        local_40 = local_20;
        local_3c = local_1c;
        local_38 = local_18;
        goto LAB_004218f7;
      }
      DAT_0064fed6 = local_40;
      DAT_0064feda = local_3c;
      DAT_0064fede = local_38;
      DAT_0064fecc = local_40;
      DAT_0064fed0 = local_3c;
      DAT_0064fed4 = local_38;
      DAT_0064f4b4 = local_40;
      DAT_0064f4b8 = local_3c;
      DAT_0064f4bc = local_38;
      DAT_0064f4be = _DAT_0065093a;
      DAT_0064f4c2 = _DAT_0065093e;
      DAT_0064f4c6 = _DAT_00650942;
      DAT_0064fec8 = 0;
      DAT_0064fee0 = 1;
      DAT_0064fee8 = 3;
      DAT_0064feec = 1;
      _DAT_0064f4aa = 0;
      DAT_0064f4ae = DAT_0064f4a4;
      DAT_0064fee4 = iVar8 - 1U & 3;
      DAT_00650919 = local_40;
      DAT_0065091d = local_3c;
      DAT_00650921 = local_38;
      DAT_0065090f = local_40;
      DAT_00650913 = local_3c;
      DAT_00650917 = local_38;
      DAT_0064fef7 = local_40;
      DAT_0064fefb = local_3c;
      DAT_0064feff = local_38;
      DAT_0064ff01 = _DAT_0065093a;
      DAT_0064ff05 = _DAT_0065093e;
      DAT_0064ff09 = _DAT_00650942;
      DAT_0065090b = 0;
      _DAT_00650923 = 0xffffffff;
      DAT_0065092b = 3;
      DAT_0065092f = 1;
      _DAT_0064feed = 0;
      DAT_00650927 = iVar8 + 1U & 3;
      _DAT_0064fef1 = DAT_0064f4a4;
      DAT_006513d9 = '\0';
      DAT_006513da = '\0';
      while( true ) {
        FUN_004222d0(0);
        FUN_004222d0(1);
        if ((DAT_006513d9 == '\0') &&
           ((DAT_0064fed6 != DAT_00650919 || (DAT_0065091d != DAT_0064feda)))) {
          DAT_006513d9 = '\x01';
        }
        local_24 = local_24 + 2;
        if ((DAT_0064fee8 == 2) && (DAT_0065092b == 2)) {
          DAT_0064fee8 = 0;
          DAT_0065092b = 0;
          if ((DAT_0064fec8 + _DAT_00651344 < (uint)(int)(short)game_state._755270_2_) &&
             (DAT_0065090b + _DAT_00651344 < (uint)(int)(short)game_state._755270_2_)) {
            local_30 = 0;
          }
          else {
            local_30 = 1;
          }
          goto LAB_004218f7;
        }
        if ((DAT_0064fee8 == 1) || (DAT_0065092b == 1)) break;
        if (local_10 < local_24) goto LAB_004218f7;
      }
      uVar5 = (uint)(byte)(1 - (DAT_0064fee8 == 1));
      local_28 = uVar5 * 0xa43;
      if (1 < *(uint *)((int)&DAT_0064fec8 + local_28)) {
        iVar3 = *(uint *)((int)&DAT_0064fec8 + local_28) - 1;
        piVar6 = (int *)((int)&DAT_0064f4c8 + local_28);
        piVar10 = (int *)(&DAT_0064f4d2 + local_28);
        local_2c = 0;
        piVar7 = piVar6;
        if (0 < iVar3) {
          do {
            if ((*piVar10 == *piVar7) && (piVar10[1] == piVar7[1])) {
              local_2c = 1;
            }
            else {
              if (local_2c != 0) {
                *piVar6 = *piVar7;
                piVar6[1] = piVar7[1];
                *(short *)(piVar6 + 2) = (short)piVar7[2];
              }
              piVar6 = (int *)((int)piVar6 + 10);
            }
            piVar7 = (int *)((int)piVar7 + 10);
            piVar10 = (int *)((int)piVar10 + 10);
            iVar3 = iVar3 + -1;
          } while (iVar3 != 0);
        }
        *piVar6 = *piVar7;
        piVar6[1] = piVar7[1];
        *(short *)(piVar6 + 2) = (short)piVar7[2];
        *(int *)((int)&DAT_0064fec8 + local_28) =
             (int)((int)piVar6 + uVar5 * -0xa43 + -0x64f4be) / 10;
      }
      FUN_00421b70((int)&DAT_0064f4b4 + local_28,0);
      DAT_0064fee8 = 0;
      DAT_0065092b = 0;
      cVar2 = FUN_004229a0(uVar5);
      if (cVar2 != '\0') break;
      bVar11 = (uint)(int)(short)game_state._755270_2_ <= _DAT_00651344;
joined_r0x0042175b:
      local_30 = (uint)bVar11;
      if (local_30 != 0) goto LAB_004218f7;
    }
    if ((local_40 == local_20) && (local_3c == local_1c)) {
      local_34 = 1;
    }
    else {
      local_34 = 0;
    }
    if ((local_34 != 0) || (local_10 < local_24)) goto LAB_004218f7;
  } while( true );
  local_3c = *(uint *)(&DAT_0065093e + _DAT_00651344 * 10);
  local_40 = *(uint *)(&DAT_0065093a + _DAT_00651344 * 10);
  local_38 = *(undefined2 *)(&DAT_00650942 + _DAT_00651344 * 10);
  if ((char)local_38 == '\0') {
    if ((local_40 == local_20) && (local_3c == local_1c)) {
LAB_00421834:
      local_34 = 1;
      goto LAB_00421846;
    }
  }
  else {
    iVar3 = local_40 - local_20;
    if (iVar3 < 0) {
      iVar3 = local_20 - local_40;
    }
    if (iVar3 < 2) {
      iVar3 = local_3c - local_1c;
      if (iVar3 < 0) {
        iVar3 = local_1c - local_3c;
      }
      if (iVar3 < 2) goto LAB_00421834;
    }
  }
  local_34 = 0;
LAB_00421846:
  if (local_34 != 0) {
LAB_004218f7:
    _DAT_0064f48c = _DAT_0064f48c + local_24;
    if (local_34 == 0) {
      if (local_30 != 0) {
        DAT_0064f490 = DAT_0064f490 + 1;
      }
      return 2 - (uint)(DAT_006513da == '\0');
    }
    iVar3 = _DAT_00651344 * 10;
    *(uint *)((int)&DAT_00650944 + iVar3) = local_40;
    *(uint *)((int)&DAT_00650948 + iVar3) = local_3c;
    *(undefined2 *)(&DAT_0065094c + iVar3) = local_38;
    _DAT_00651344 = _DAT_00651344 + 1;
    return 0;
  }
  if (game_state._755278_1_ != '\0') {
    game_state._755278_1_ = game_state._755278_1_ + -1;
  }
  goto LAB_0042122f;
}
