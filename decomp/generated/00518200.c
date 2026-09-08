/* Ghidra 12.1.3 pseudocode; entry 00518200; FUN_00518200.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00518200(undefined2 *param_1,char param_2)

{
  byte bVar1;
  uint uVar2;
  uint *puVar3;
  byte bVar4;
  int iVar5;
  int iVar6;
  undefined1 local_b;
  byte local_a;
  byte bStack_9;
  ushort local_8;

  bVar4 = 0;
  local_b = 0;
  local_8 = CONCAT11((char)((ushort)param_1[1] >> 8),(char)((ushort)*param_1 >> 8)) & 0xfefe;
  uVar2 = (local_8 & 0xfe) * 2 | local_8 & 0xfe00;
  puVar3 = &game_state.level_data[0].flags + uVar2;
  if ((*puVar3 & 0x200) == 0) {
    if ((*puVar3 & 4) != 0) {
      return CONCAT31((int3)((uint)puVar3 >> 8),2);
    }
    bVar1 = (&game_state.level_data[0].c_3)[uVar2 * 4];
    if (param_2 == '\0') {
      bVar4 = *(byte *)(landscape_height_array + (bVar1 & 0xf)) & 1;
    }
    else if ((*(byte *)(landscape_height_array + (bVar1 & 0xf)) & 0x3d) != 0) {
      bVar4 = 1;
    }
    if (bVar4 == 0) {
      return 4;
    }
    bStack_9 = (byte)(local_8 >> 8);
    local_a = (byte)local_8;
    iVar5 = (uint)bStack_9 * 0x100 + (uint)local_a;
    puVar3 = (uint *)(iVar5 >> 3);
    if ((*(byte *)(game_state._841980_4_ + (int)puVar3) & '\x01' << ((byte)iVar5 & 7)) != 0) {
      iVar5 = (uint)(byte)(local_a + 1) + (uint)bStack_9 * 0x100;
      puVar3 = (uint *)(iVar5 >> 3);
      if ((*(byte *)(game_state._841980_4_ + (int)puVar3) & '\x01' << ((byte)iVar5 & 7)) != 0) {
        iVar6 = (uint)(byte)(bStack_9 + 1) * 0x100;
        iVar5 = (uint)local_a + iVar6;
        puVar3 = (uint *)(iVar5 >> 3);
        if ((*(byte *)(game_state._841980_4_ + (int)puVar3) & '\x01' << ((byte)iVar5 & 7)) != 0) {
          iVar6 = (uint)(byte)(local_a + 1) + iVar6;
          puVar3 = (uint *)(iVar6 >> 3);
          if ((*(byte *)(game_state._841980_4_ + (int)puVar3) & '\x01' << ((byte)iVar6 & 7)) != 0)
          goto LAB_00518386;
        }
      }
    }
    return CONCAT31((int3)((uint)puVar3 >> 8),3);
  }
  local_b = 1;
LAB_00518386:
  return CONCAT31((int3)((uint)puVar3 >> 8),local_b);
}
