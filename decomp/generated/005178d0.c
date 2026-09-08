/* Ghidra 12.1.3 pseudocode; entry 005178d0; FUN_005178d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_005178d0(int param_1,int param_2)

{
  byte *pbVar1;
  byte bVar2;
  byte bVar3;
  char cVar4;
  undefined1 uVar5;
  uint uVar6;
  int iVar7;
  int iVar8;
  undefined2 local_8;

  uVar5 = 0;
  bVar2 = *(byte *)(param_2 + 1);
  bVar3 = *(byte *)(param_2 + 3);
  local_8 = CONCAT11(bVar3,bVar2);
  uVar6 = (local_8 & 0xfe) * 2 | local_8 & 0xfe00;
  iVar7 = uVar6 * 4;
  pbVar1 = (byte *)(&game_state.level_data[0].flags + uVar6);
  uVar6 = *(uint *)(param_1 + 0x10);
  if (((uVar6 & 0x10007) == 0) || ((*(byte *)(param_1 + 0xf) & 0x20) != 0)) {
    if ((*(byte *)((int)&game_state.level_data[0].flags + iVar7 + 1) & 2) == 0) {
      if ((*pbVar1 & 4) != 0) {
        return 2;
      }
      if (*(char *)(param_1 + 0x2b) == '\x01') {
        if (((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar7] & 0xf)) &
             0x3c) != 0) && ((*(byte *)((int)&game_state.level_data[0].flags + iVar7 + 3) & 1) == 0)
           ) {
          return 2;
        }
      }
      iVar8 = (uint)bVar2 + (uint)bVar3 * 0x100;
      if ((*(byte *)(game_state._841980_4_ + (iVar8 >> 3)) & '\x01' << ((byte)iVar8 & 7)) == 0) {
        return 3;
      }
      if ((uVar6 & 0x800000) == 0) {
        cVar4 = FUN_0044f980(param_2);
        if (cVar4 == '\0') {
          return 4;
        }
      }
      else if ((uVar6 & 0x1000000) == 0) {
        cVar4 = FUN_0044f980(param_2);
        if (cVar4 == '\0') {
          return 4;
        }
      }
      else if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar7] & 0xf)) &
               2) != 0) {
        return 4;
      }
    }
    else if ((*(byte *)(param_1 + 0xf) & 0x20) == 0) {
      uVar5 = 1;
    }
  }
  else if ((*pbVar1 & 4) == 0) {
    iVar8 = (uint)bVar2 + (uint)bVar3 * 0x100;
    if ((*(byte *)(game_state._841980_4_ + (iVar8 >> 3)) & '\x01' << ((byte)iVar8 & 7)) == 0) {
      return 3;
    }
    cVar4 = FUN_0044f980(param_2);
    if (cVar4 == '\0') {
      if ((*(byte *)(param_1 + 0x12) & 0x80) == 0) {
        return 4;
      }
      if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar7] & 0xf)) & 0x3c
          ) == 0) {
        return 4;
      }
      iVar7 = FUN_004665c0(pbVar1);
      if ((iVar7 == 0) && ((*(byte *)(param_1 + 0x13) & 1) == 0)) {
        return 4;
      }
    }
    else if ((*(byte *)((int)&game_state.level_data[0].flags + iVar7 + 1) & 2) != 0) {
      uVar5 = FUN_00517f10(param_1,pbVar1);
      return uVar5;
    }
  }
  return uVar5;
}
