/* Ghidra 12.1.3 pseudocode; entry 004f87f0; FUN_004f87f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f87f0(undefined4 param_1,undefined2 *param_2,int param_3,int param_4)

{
  undefined2 uVar1;
  uint uVar2;
  int iVar3;
  byte *pbVar4;
  int iVar5;
  undefined2 local_12;
  int local_10;
  uint local_c;
  int local_8;
  int local_4;

  local_4 = -1;
  iVar3 = 100000;
  iVar5 = 0;
  pbVar4 = &DAT_008e03e4;
  uVar1 = *param_2;
  local_c = 0;
  do {
    if ((*pbVar4 != 0) && ((int)local_c <= (int)(uint)*pbVar4)) {
      FUN_004f5e50(iVar5,&local_10,&local_8);
      local_12._0_1_ = (byte)uVar1;
      uVar2 = (uint)(byte)((char)local_10 * ' ' + 0x10);
      local_10 = (byte)local_12 - uVar2;
      if (local_10 < 0) {
        local_10 = uVar2 - (byte)local_12;
      }
      if (0x80 < local_10) {
        local_10 = 0x100 - local_10;
      }
      local_12._1_1_ = (byte)((ushort)uVar1 >> 8);
      uVar2 = (uint)(byte)((char)local_8 * ' ' + 0x10);
      local_8 = local_12._1_1_ - uVar2;
      if (local_8 < 0) {
        local_8 = uVar2 - local_12._1_1_;
      }
      if (0x80 < local_8) {
        local_8 = 0x100 - local_8;
      }
      local_10 = FUN_00586000(local_8 * local_8 + local_10 * local_10);
      if ((param_3 <= local_10) && (local_10 <= param_4)) {
        uVar2 = (uint)*pbVar4;
        if (((int)local_c < (int)uVar2) || ((local_c == uVar2 && (local_10 < iVar3)))) {
          iVar3 = local_10;
          local_c = uVar2;
          local_4 = iVar5;
        }
      }
    }
    iVar5 = iVar5 + 1;
    pbVar4 = pbVar4 + 1;
  } while (iVar5 < 0x40);
  if (local_c == 0) {
    return 0;
  }
  iVar5 = 0;
  local_10 = 0;
  local_8 = 0;
  for (iVar3 = DAT_00890334; iVar3 != 0; iVar3 = *(int *)(iVar3 + 8)) {
    if ((int)(short)(*(ushort *)(iVar3 + 0x3d) >> 0xd) +
        (int)(short)(*(ushort *)(iVar3 + 0x3f) >> 10 & 0x38) == local_4) {
      iVar5 = iVar5 + 1;
      local_c._0_2_ =
           CONCAT11((char)(*(ushort *)(iVar3 + 0x3f) >> 8),(char)(*(ushort *)(iVar3 + 0x3d) >> 8)) &
           0xfefe;
      local_10 = local_10 + (uint)(byte)(ushort)local_c;
      local_12._1_1_ = (byte)((ushort)local_c >> 8);
      local_8 = local_8 + (uint)local_12._1_1_;
    }
  }
  if (iVar5 != 0) {
    local_12 = CONCAT11((char)(local_8 / iVar5),(char)(local_10 / iVar5));
    *param_2 = local_12;
    return 1;
  }
  return 0;
}
