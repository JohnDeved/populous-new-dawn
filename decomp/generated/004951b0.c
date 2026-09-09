/* Ghidra 12.1.3 pseudocode; entry 004951b0; FUN_004951b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004951b0(ushort param_1,short param_2)

{
  char cVar1;
  char cVar2;
  char cVar3;
  int iVar4;
  char cVar5;
  ushort *puVar6;
  int iVar7;
  int iVar8;
  ushort local_1c;
  byte bStack_19;
  undefined2 local_18;
  short local_16;
  ushort local_14;
  short local_12;
  int local_10;
  ushort local_c [4];
  int local_4;

  if ((0 < (int)game_state._644600_4_) && (local_14 = param_1 & 0xfefe, 1 < param_2)) {
    if (param_2 < 7) {
      local_10 = 1;
      local_c[0] = local_14;
    }
    else {
      local_10 = 4;
      cVar1 = (char)param_2;
      cVar5 = cVar1 * '\x02';
      local_18._0_1_ = (char)local_14;
      cVar2 = (char)local_18;
      local_18._1_1_ = (char)(local_14 >> 8);
      cVar3 = local_18._1_1_;
      local_18 = CONCAT11(local_18._1_1_ + cVar5,(char)local_18 + cVar1 * -2);
      local_c[0] = local_18;
      local_18 = CONCAT11(cVar3 + cVar5,cVar2 + cVar5);
      local_c[1] = local_18;
      local_c[2] = local_14;
      local_18 = CONCAT11(cVar3,cVar2 + cVar1 * -4);
      local_c[3] = local_18;
    }
    local_4 = 0;
    iVar7 = 0x93a7a0;
    if (0 < (int)game_state._644600_4_) {
      do {
        if ((*(byte *)(iVar7 + 3) & 1) != 0) {
          local_4 = local_4 + 1;
          local_18 = ((*(ushort *)(iVar7 + 4) & 0xfe) + 1) * 0x100;
          local_1c = *(ushort *)(iVar7 + 4) & 0xfefe;
          iVar8 = 0;
          local_16 = ((local_1c >> 8) + 1) * 0x100;
          cVar1 = (&DAT_005ca2df)[*(char *)(iVar7 + 1) * 2];
          if (0 < local_10) {
            puVar6 = local_c;
LAB_004952f5:
            local_14 = (*puVar6 & 0xfe) << 8;
            bStack_19 = (byte)(*puVar6 >> 8) & 0xfe;
            local_12 = (ushort)bStack_19 << 8;
            iVar4 = calc_distance_toroidal(&local_18,&local_14);
            if (cVar1 * 0x200 <= iVar4) goto code_r0x0049533c;
            for (iVar8 = *(int *)(iVar7 + 0x14); iVar8 != 0; iVar8 = *(int *)(iVar8 + 10)) {
              if ((*(byte *)(iVar8 + 4) & 2) != 0) {
                *(byte *)(iVar8 + 4) = *(byte *)(iVar8 + 4) & 0xfd;
                *(short *)(iVar7 + 10) = *(short *)(iVar7 + 10) + 1;
                game_state._644608_4_ = game_state._644608_4_ + 1;
              }
              *(byte *)(iVar8 + 4) = *(byte *)(iVar8 + 4) & 0xfb;
            }
          }
        }
LAB_00495372:
        iVar7 = iVar7 + 0x18;
      } while (local_4 < (int)game_state._644600_4_);
    }
  }
  return;
code_r0x0049533c:
  puVar6 = puVar6 + 1;
  iVar8 = iVar8 + 1;
  if (local_10 <= iVar8) goto LAB_00495372;
  goto LAB_004952f5;
}
