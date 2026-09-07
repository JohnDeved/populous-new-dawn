/* Ghidra 12.1.3 pseudocode; entry 0043b010; FUN_0043b010.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0043b010(int param_1)

{
  ushort uVar1;
  bool bVar2;
  short sVar3;
  int iVar4;
  ushort *puVar5;
  int iVar6;
  int iVar7;
  undefined4 local_4;

  bVar2 = false;
  if (*(short *)(param_1 + 0x9b) == 0) {
    iVar4 = 0;
    puVar5 = (ushort *)(param_1 + 0x8b);
    do {
      if ((*puVar5 != 0) &&
         ((*(char *)((int)(game_state.sunlight_array + 0x32) + (uint)*puVar5 * 10) == '\v' ||
          (*(char *)((int)(game_state.sunlight_array + 0x32) + (uint)*puVar5 * 10) == '\x19')))) {
        bVar2 = true;
        iVar7 = iVar4;
        break;
      }
      puVar5 = puVar5 + 1;
      iVar4 = iVar4 + 1;
      iVar7 = local_4;
    } while (iVar4 < 8);
    if (bVar2) {
      while ((iVar4 < 8 &&
             (((uVar1 = *(ushort *)(param_1 + 0x8b + iVar4 * 2), iVar6 = local_4, uVar1 == 0 ||
               (iVar6 = iVar4,
               *(char *)((int)(game_state.sunlight_array + 0x32) + (uint)uVar1 * 10) == '\v')) ||
              (*(char *)((int)(game_state.sunlight_array + 0x32) + (uint)uVar1 * 10) == '\x19')))))
      {
        iVar4 = iVar4 + 1;
        local_4 = iVar6;
      }
      if (local_4 != iVar7) {
        if (iVar7 <= (int)local_4) {
          puVar5 = (ushort *)(param_1 + 0x8b + iVar7 * 2);
          iVar4 = (local_4 - iVar7) + 1;
          do {
            if (*puVar5 != 0) {
              iVar7 = (uint)*puVar5 * 10;
              if (*(char *)((int)(game_state.sunlight_array + 0x32) + iVar7) == '\v') {
                *(char *)((int)(game_state.sunlight_array + 0x32) + iVar7) = '\x19';
                local_4 = *(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar7 + 6) &
                          0xfffffffe;
                sVar3 = (short)local_4;
                local_4._1_1_ = (byte)(local_4 >> 8) & 0xfe;
                *(short *)((int)(game_state.sunlight_array + 0x32) + iVar7 + 6) = sVar3 << 8;
                *(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar7 + 8) =
                     (ushort)local_4._1_1_ << 8;
              }
            }
            puVar5 = puVar5 + 1;
            iVar4 = iVar4 + -1;
          } while (iVar4 != 0);
        }
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10;
      }
    }
  }
  return;
}
