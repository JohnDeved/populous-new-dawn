/* Ghidra 12.1.3 pseudocode; entry 005149f0; process_building_smoke.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_building_smoke(int param_1)

{
  int iVar1;
  char cVar2;
  ushort uVar3;
  undefined1 uVar4;
  short sVar5;
  undefined4 in_EAX;
  undefined2 uVar10;
  uint uVar6;
  uint uVar7;
  uint uVar8;
  int iVar9;
  byte bVar11;
  uint uVar12;
  int iVar13;
  undefined4 local_e;
  char local_a;
  undefined2 uStack_8;

  uVar4 = interface_state;
  interface_state = 3;
  if (*(short *)(param_1 + 0x6c) < 9) {
    uVar3 = *(ushort *)(param_1 + 0x72);
    uVar10 = (undefined2)((uint)in_EAX >> 0x10);
    bVar11 = *(byte *)(param_1 + 0x75);
    local_e = (uint)uVar3;
    if (bVar11 != 1) {
      cVar2 = (-2 - bVar11) * '\x02';
      local_e._2_1_ = (char)uVar3;
      local_e._2_1_ = local_e._2_1_ + cVar2;
      local_e._3_1_ = (char)(uVar3 >> 8);
      local_e._0_3_ = CONCAT12(local_e._2_1_,uVar3);
      cVar2 = local_e._3_1_ + cVar2;
      local_e = CONCAT13(cVar2,(undefined3)local_e);
      uVar6 = (uint)bVar11 << 9;
      uVar8 = uVar6;
      for (iVar1 = (uint)bVar11 * 2 + 4; uVar10 = (undefined2)(uVar8 >> 0x10), iVar1 != 0;
          iVar1 = iVar1 + -1) {
        uStack_8 = (undefined2)iVar1;
        uVar8 = (uint)*(byte *)(param_1 + 0x75);
        local_a = local_e._2_1_;
        for (iVar13 = uVar8 * 2 + 4; iVar13 != 0; iVar13 = iVar13 + -1) {
          uVar7 = (CONCAT11(cVar2,local_a) & 0xfe) * 2 | CONCAT11(cVar2,local_a) & 0xfe00;
          uVar8 = FUN_00450370(local_e,CONCAT22(uStack_8,CONCAT11(cVar2,local_a)));
          if ((int)uVar8 < (int)uVar6) {
            sVar5 = 0;
            uVar8 = uVar8 - uVar6 / 2;
            uVar12 = (int)uVar8 >> 0x1f;
            iVar9 = (uVar8 ^ uVar12) - uVar12;
            if (iVar9 < 0x200) {
              sVar5 = *(short *)(param_1 + 0x76);
            }
            sVar5 = (&game_state.level_data[0].height)[uVar7 * 2] -
                    *(char *)(param_1 + 0x74) * sVar5;
            uVar8 = CONCAT22((short)((uint)iVar9 >> 0x10),sVar5);
            (&game_state.level_data[0].height)[uVar7 * 2] = sVar5;
            if (sVar5 < 0) {
              (&game_state.level_data[0].height)[uVar7 * 2] = 0;
            }
            if (0x400 < (short)(&game_state.level_data[0].height)[uVar7 * 2]) {
              (&game_state.level_data[0].height)[uVar7 * 2] = 0x400;
            }
          }
          local_a = local_a + '\x02';
        }
        uVar8 = CONCAT31((int3)(uVar8 >> 8),local_e._2_1_);
        cVar2 = cVar2 + '\x02';
      }
    }
    uVar8 = local_e;
    if (*(short *)(param_1 + 0x6c) < 8) {
      bVar11 = *(char *)(param_1 + 0x75) + 1;
      *(byte *)(param_1 + 0x75) = bVar11;
      cVar2 = (-2 - bVar11) * '\x02';
      local_e._2_1_ = (char)local_e;
      local_e._2_1_ = local_e._2_1_ + cVar2;
      local_e._3_1_ = (char)(uVar8 >> 8);
      cVar2 = local_e._3_1_ + cVar2;
      local_e = CONCAT13(cVar2,(undefined3)local_e);
      *(short *)(param_1 + 0x76) = *(short *)(param_1 + 0x76) + -8;
      uVar6 = (uint)bVar11 << 9;
      uVar8 = uVar6;
      for (iVar1 = (uint)bVar11 * 2 + 4; uVar10 = (undefined2)(uVar8 >> 0x10), iVar1 != 0;
          iVar1 = iVar1 + -1) {
        uVar8 = (uint)*(byte *)(param_1 + 0x75);
        local_a = local_e._2_1_;
        for (iVar13 = uVar8 * 2 + 4; uStack_8 = (undefined2)iVar1, iVar13 != 0; iVar13 = iVar13 + -1
            ) {
          uVar7 = (CONCAT11(cVar2,local_a) & 0xfe) * 2 | CONCAT11(cVar2,local_a) & 0xfe00;
          uVar8 = FUN_00450370(local_e,CONCAT22(uStack_8,CONCAT11(cVar2,local_a)));
          if (((int)uVar8 < (int)uVar6) && ((&game_state.level_data[0].height)[uVar7 * 2] != 0)) {
            sVar5 = 0;
            uVar8 = uVar8 - uVar6 / 2;
            uVar12 = (int)uVar8 >> 0x1f;
            iVar9 = (uVar8 ^ uVar12) - uVar12;
            if (iVar9 < 0x200) {
              sVar5 = *(short *)(param_1 + 0x76);
            }
            sVar5 = *(char *)(param_1 + 0x74) * sVar5 +
                    (&game_state.level_data[0].height)[uVar7 * 2];
            uVar8 = CONCAT22((short)((uint)iVar9 >> 0x10),sVar5);
            (&game_state.level_data[0].height)[uVar7 * 2] = sVar5;
            if (sVar5 < 0) {
              (&game_state.level_data[0].height)[uVar7 * 2] = 0;
            }
            if (0x400 < (short)(&game_state.level_data[0].height)[uVar7 * 2]) {
              (&game_state.level_data[0].height)[uVar7 * 2] = 0x400;
            }
          }
          local_a = local_a + '\x02';
        }
        uVar8 = CONCAT31((int3)(uVar8 >> 8),local_e._2_1_);
        cVar2 = cVar2 + '\x02';
      }
    }
    land_level_processing_1(local_e,CONCAT22(uVar10,*(byte *)(param_1 + 0x75) + 2),1);
    level_land_processing_2();
    *(short *)(param_1 + 0x6c) = *(short *)(param_1 + 0x6c) + 1;
  }
  else {
    update_after_unit_alloc(param_1);
  }
  interface_state = uVar4;
  return;
}
