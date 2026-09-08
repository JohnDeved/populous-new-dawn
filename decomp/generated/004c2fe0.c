/* Ghidra 12.1.3 pseudocode; entry 004c2fe0; FUN_004c2fe0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004c2fe0(byte param_1)

{
  byte bVar1;
  bool bVar2;
  short *psVar3;
  int iVar4;
  char cVar5;
  undefined4 *puVar6;

  if (spell_global_set != 0) {
    spell_global_set = 0;
    puVar6 = &DAT_009fcfe0;
    for (iVar4 = 7; iVar4 != 0; iVar4 = iVar4 + -1) {
      *puVar6 = 0;
      puVar6 = puVar6 + 1;
    }
    *(undefined2 *)puVar6 = 0;
    *(undefined1 *)((int)puVar6 + 2) = 0;
    if ((game_state.level_flags & 0x20) == 0) {
      iVar4 = 1;
      cVar5 = '\x01';
      DAT_009fcfe0._0_1_ = (undefined1)spell_global;
      psVar3 = &DAT_005a810e;
      do {
        if (*psVar3 != 0) {
          *(char *)((int)&DAT_009fcfe0 + iVar4) = cVar5;
          iVar4 = iVar4 + 1;
        }
        psVar3 = psVar3 + 0x1f;
        cVar5 = cVar5 + '\x01';
      } while (psVar3 < (short *)0x5a85e7);
      do {
        iVar4 = 2;
        bVar2 = true;
        do {
          bVar1 = *(byte *)((int)&DAT_009fcfe0 + iVar4);
          if (((&DAT_005a80d0)[(uint)bVar1 * 0x1f] != 0) &&
             (*(int *)((int)&DAT_005a80d4 + (uint)bVar1 * 0x3e) <
              *(int *)((int)&DAT_005a80d4 + (uint)(byte)pls_tx_mem[iVar4 + 0x3ffff] * 0x3e))) {
            bVar2 = false;
            *(undefined *)((int)&DAT_009fcfe0 + iVar4) = pls_tx_mem[iVar4 + 0x3ffff];
            pls_tx_mem[iVar4 + 0x3ffff] = bVar1;
          }
          iVar4 = iVar4 + 1;
        } while (iVar4 < 0x16);
      } while (!bVar2);
    }
    else {
      iVar4 = 1;
      do {
        *(char *)((int)&DAT_009fcfe0 + iVar4) = (char)iVar4;
        iVar4 = iVar4 + 1;
      } while (iVar4 < 0x1f);
    }
  }
  return *(undefined1 *)((int)&DAT_009fcfe0 + (uint)param_1);
}
