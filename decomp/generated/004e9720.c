/* Ghidra 12.1.3 pseudocode; entry 004e9720; FUN_004e9720.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004e9720(int param_1,undefined4 *param_2)

{
  undefined4 uVar1;
  bool bVar2;
  bool bVar3;
  char cVar4;
  short sVar5;
  uint uVar6;
  undefined3 uVar8;
  uint uVar7;
  int iVar9;
  undefined2 local_2c;
  short local_2a;
  short local_28;
  short local_24;
  short sStack_22;
  short local_20;
  int local_1c;
  int local_18;
  uint local_14;
  int local_10;
  uint local_c;
  int local_8;
  int local_4;

  local_1c = 0;
  uVar7 = *(uint *)(param_1 + 0xc);
  uVar6 = uVar7 | 0x800;
  *(uint *)(param_1 + 0xc) = uVar6;
  if (*(char *)(param_1 + 0x65) < 'A') {
    cVar4 = *(char *)(param_1 + 0x66);
    uVar8 = (undefined3)(uVar6 >> 8);
    uVar7 = CONCAT31(uVar8,cVar4);
    if (cVar4 < '0') {
      uVar7 = CONCAT31(uVar8,cVar4 + '\x01');
      *(char *)(param_1 + 0x66) = cVar4 + '\x01';
    }
  }
  else {
    *(undefined1 *)(param_1 + 0x66) = 0;
    uVar7 = uVar7 | 0x80000800;
    *(uint *)(param_1 + 0xc) = uVar7;
  }
  if ((*(byte *)(param_1 + 0xd) & 8) != 0) {
    *param_2 = *(undefined4 *)(param_1 + 0x3d);
    *(undefined2 *)(param_2 + 1) = *(undefined2 *)(param_1 + 0x41);
    local_2c = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                        (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    uVar7 = (local_2c & 0xfe) * 2 | local_2c & 0xfe00;
    if ((*(byte *)((int)&game_state.level_data[0].flags + uVar7 * 4 + 1) & 2) == 0) {
      local_8 = 0;
      uVar7 = (uint)*(short *)(param_1 + 0x5f);
      local_c = uVar7;
      do {
        if (local_1c != 0) break;
        local_10 = 0xaa;
        local_4 = (int)*(short *)(param_1 + 0x5d);
        bVar2 = false;
        local_18 = 0;
        iVar9 = (-(uint)((*(byte *)(param_1 + 0x66) & 1) == 0) & 0xfffffffe) + 1;
        do {
          if (local_1c != 0) break;
          local_20 = *(short *)(param_2 + 1);
          local_24 = (short)*param_2;
          sStack_22 = (short)((uint)*param_2 >> 0x10);
          local_2c = 0;
          local_14 = local_10 * iVar9 + local_4 & 0x7ff;
          local_28 = 0;
          FUN_004e93f0(&local_2c,&local_24,local_c,local_14);
          local_24 = local_24 + local_2c;
          local_20 = local_20 + local_2a;
          uVar1 = CONCAT22(sStack_22,local_24);
          sStack_22 = sStack_22 + local_28;
          local_20 = calc_point_height(uVar1,CONCAT22(local_20,sStack_22));
          cVar4 = FUN_005178d0(param_1,&local_24);
          if (cVar4 == '\0') {
            local_1c = 1;
            if (*(short *)(param_1 + 0x61) < 1) {
              sVar5 = (*(char *)(param_1 + 0x66) + 1) * ((short)(local_18 >> 1) + 1);
              *(short *)(param_1 + 0x61) = sVar5;
              *(short *)(param_1 + 0x61) = sVar5 >> 1;
            }
            *(undefined2 *)(param_1 + 0x5d) = (undefined2)local_14;
            *param_2 = CONCAT22(sStack_22,local_24);
            *(short *)(param_2 + 1) = local_20;
          }
          bVar3 = !bVar2;
          bVar2 = (bool)(bVar2 + 1U & 1);
          local_10 = local_10 + (bVar3 - 1 & 0xaa);
          local_18 = local_18 + 1;
          iVar9 = -iVar9;
        } while (local_18 < 0xb);
        uVar7 = (uint)*(short *)(param_1 + 0x5f);
        local_c = local_c + uVar7;
        local_8 = local_8 + 1;
      } while (local_8 < 2);
    }
    else {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x20000000;
      *(undefined2 *)(param_1 + 0x61) = 0;
      local_1c = 1;
    }
  }
  return CONCAT31((int3)(uVar7 >> 8),(undefined1)local_1c);
}
