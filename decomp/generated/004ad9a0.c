/* Ghidra 12.1.3 pseudocode; entry 004ad9a0; FUN_004ad9a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ad9a0(void)

{
  byte bVar1;
  byte bVar2;
  byte bVar3;
  undefined2 uVar4;
  int iVar5;
  int iVar6;
  byte local_6;
  byte bStack_5;

  clear_rddata_chunk();
  DAT_00895faf = 0;
  if (DAT_0089c6e7 == '\f') {
    FUN_00438ae0(0);
    iVar5 = (int)player_tribe_num;
    if ((0 < *(int *)&game_state.tribes_array[iVar5].field_0x92d) ||
       (0 < *(int *)&game_state.tribes_array[iVar5].field_0x931)) {
      if (DAT_0089c6e8 != '\x02') {
        FUN_00437010(CONCAT31((int3)((uint)(iVar5 * 0xc65) >> 8),'\x01' - (DAT_0089c6e8 == '\x04')))
        ;
        FUN_004199c0(&DAT_00895df6 +
                     *(char *)((int)game_state.tribes_array[player_tribe_num].field1341_0x8bf + 1) *
                     4);
      }
      if (DAT_0089c6e8 == '\0') {
        FUN_00438ae0(1);
        return;
      }
      if (DAT_0089c6e8 != '\x02') {
        return;
      }
      FUN_00438ae0(1);
      uVar4 = DAT_00895e94;
      load_level_flags = load_level_flags | 0x40000;
      if ((globe_update_flags & 1) != 0) {
        iVar5 = *(char *)((int)game_state.tribes_array[player_tribe_num].field1341_0x8bf + 1) * 0x10
        ;
        bVar1 = (&DAT_005a7dc2)[(uint)*(byte *)((int)&DAT_00895ea0 + (uint)DAT_00895e9d) * 0x16];
        bVar2 = (&DAT_005a7dc1)[(uint)*(byte *)((int)&DAT_00895ea0 + (uint)DAT_00895e9d) * 0x16];
        local_6 = (byte)DAT_00895e94;
        iVar6 = (uint)local_6 - (uint)minimap_centre_x;
        if (iVar6 < 0) {
          iVar6 = (uint)minimap_centre_x - (uint)local_6;
        }
        if (0x80 < iVar6) {
          iVar6 = 0x100 - iVar6;
        }
        (&DAT_00895e04)[iVar5] = (char)iVar6;
        bStack_5 = (byte)((ushort)uVar4 >> 8);
        iVar6 = (uint)bStack_5 - (uint)minimap_centre_y;
        if (iVar6 < 0) {
          iVar6 = (uint)minimap_centre_y - (uint)bStack_5;
        }
        if (0x80 < iVar6) {
          iVar6 = 0x100 - iVar6;
        }
        (&DAT_00895e05)[iVar5] = (char)iVar6;
        bVar3 = (char)(&DAT_00895e04)[iVar5] >> 7;
        (&DAT_00895e04)[iVar5] = ((&DAT_00895e04)[iVar5] ^ bVar3) - bVar3;
        bVar3 = (char)(&DAT_00895e05)[iVar5] >> 7;
        (&DAT_00895e05)[iVar5] = ((&DAT_00895e05)[iVar5] ^ bVar3) - bVar3;
        if ((int)(char)(&DAT_00895e04)[iVar5] < (int)(uint)bVar2) {
          (&DAT_00895e04)[iVar5] = bVar2;
        }
        if ((int)(uint)bVar1 < (int)(char)(&DAT_00895e04)[iVar5]) {
          (&DAT_00895e04)[iVar5] = bVar1;
        }
        if ((int)(char)(&DAT_00895e05)[iVar5] < (int)(uint)bVar2) {
          (&DAT_00895e05)[iVar5] = bVar2;
        }
        if ((int)(uint)bVar1 < (int)(char)(&DAT_00895e05)[iVar5]) {
          (&DAT_00895e05)[iVar5] = bVar1;
        }
        DAT_00895ebb = (&DAT_00895e04)[iVar5];
        DAT_00895ebc = (&DAT_00895e05)[iVar5];
      }
    }
  }
  return;
}
