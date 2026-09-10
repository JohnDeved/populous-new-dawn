/* Ghidra 12.1.3 pseudocode; entry 00501700; FUN_00501700.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00501700(int param_1)

{
  short sVar1;
  undefined2 uVar2;
  short sVar3;
  undefined4 uVar4;
  int iVar5;
  undefined1 *puVar6;
  char *pcVar7;
  int iVar8;
  short *psVar9;
  int iVar10;
  char local_1c;
  char cStack_1a;
  undefined4 local_14;
  undefined2 local_10;
  int local_c;
  undefined4 local_8;
  undefined2 local_4;

  if (*(char *)(param_1 + 0x3b) != '\x01') {
    iVar8 = 0;
    sVar1 = *(short *)(param_1 + 0x5d);
    uVar4 = *(undefined4 *)(param_1 + 0x3d);
    uVar2 = *(undefined2 *)(param_1 + 0x41);
    local_c = 4;
    pcVar7 = (char *)(param_1 + 0x82);
    do {
      local_8 = uVar4;
      local_4 = uVar2;
      if (iVar8 != 0) {
        move_pos_angle_length(&local_8,(int)sVar1 + 0x400U & 0x7ff,iVar8);
      }
      iVar8 = iVar8 + 0x12;
      local_1c = (char)uVar4;
      *pcVar7 = (char)local_8 - local_1c;
      cStack_1a = (char)((uint)uVar4 >> 0x10);
      pcVar7[1] = (char)((uint)local_8 >> 0x10) - cStack_1a;
      local_14 = local_8;
      local_10 = local_4;
      move_pos_angle_length
                (&local_14,
                 CONCAT22((short)((uint)&local_8 >> 0x10),*(short *)(param_1 + 0x5d) + -0x200) &
                 0xffff07ff,0x12);
      pcVar7[2] = (char)local_14 - local_1c;
      pcVar7[3] = (char)((uint)local_14 >> 0x10) - cStack_1a;
      local_14 = local_8;
      local_10 = local_4;
      move_pos_angle_length
                (&local_14,
                 CONCAT22((short)((uint)&local_8 >> 0x10),*(short *)(param_1 + 0x5d) + 0x200) &
                 0xffff07ff,0x12);
      pcVar7[4] = (char)local_14 - local_1c;
      pcVar7[5] = (char)((uint)local_14 >> 0x10) - cStack_1a;
      local_c = local_c + -1;
      pcVar7 = pcVar7 + 6;
    } while (local_c != 0);
    return;
  }
  iVar10 = 0xc;
  iVar8 = maybe_sin[*(short *)(param_1 + 0x5d)];
  iVar5 = maybe_cos[*(short *)(param_1 + 0x5d)];
  puVar6 = (undefined1 *)(param_1 + 0x82);
  psVar9 = &DAT_005d6bc8;
  do {
    sVar1 = psVar9[1];
    sVar3 = *psVar9;
    iVar10 = iVar10 + -1;
    *puVar6 = (char)((uint)(iVar8 * sVar1 + iVar5 * sVar3) >> 0x10);
    puVar6[1] = (char)((uint)(iVar5 * sVar1 - iVar8 * sVar3) >> 0x10);
    puVar6 = puVar6 + 2;
    psVar9 = psVar9 + 2;
  } while (iVar10 != 0);
  return;
}
