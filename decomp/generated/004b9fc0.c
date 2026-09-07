/* Ghidra 12.1.3 pseudocode; entry 004b9fc0; FUN_004b9fc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004b9fc0(int param_1,short *param_2)

{
  byte bVar1;
  shape_entry *psVar2;
  ushort uVar3;
  char cVar4;
  int iVar5;
  short sVar6;
  short sVar7;
  int iVar8;
  undefined2 local_e;
  undefined4 local_c;
  undefined2 local_8;
  short local_6;

  psVar2 = shapes_mem;
  if (*(char *)(param_1 + 0x9e) != '\n') {
    bVar1 = *(byte *)(param_1 + 0x9b);
    local_8 = *(ushort *)(param_1 + 0x68) & 0xfffe;
    uVar3 = local_8;
    local_8._1_1_ = (byte)(local_8 >> 8) & 0xfe;
    *param_2 = uVar3 * 0x100;
    param_2[1] = (ushort)local_8._1_1_ * 0x100;
    *param_2 = (char)psVar2[bVar1].field6_0x6 * 0x40 + uVar3 * 0x100;
    param_2[1] = (char)psVar2[bVar1].field7_0x7 * 0x40 + (ushort)local_8._1_1_ * 0x100;
    return;
  }
  local_c = *(ushort *)(param_1 + 0x68) & 0xfffffefe;
  iVar8 = 0;
  *param_2 = (ushort)(byte)local_c << 8;
  param_2[1] = (ushort)local_c._1_1_ << 8;
  do {
    iVar5 = (uint)*(byte *)(param_1 + 0x9b) + iVar8;
    sVar6 = (char)shapes_mem[iVar5].field6_0x6 * 0x40 + *param_2;
    sVar7 = (char)shapes_mem[iVar5].field7_0x7 * 0x40 + param_2[1];
    local_e = CONCAT11((char)((ushort)sVar7 >> 8),(char)((ushort)sVar6 >> 8));
    if (((&game_state.level_data[0].unit_index_2)[((local_e & 0xfe) * 2 | local_e & 0xfe00) * 2] &
        0x3ff) == 0) {
      local_8 = sVar6;
      local_6 = sVar7;
      cVar4 = FUN_00518200(&local_8,0);
      if (cVar4 == '\0') {
        local_c = CONCAT22(sVar7,sVar6);
        *(uint *)param_2 = local_c;
        return;
      }
    }
    iVar8 = iVar8 + 1;
  } while (iVar8 < 4);
  return;
}
