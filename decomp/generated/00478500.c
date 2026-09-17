/* Ghidra 12.1.3 pseudocode; entry 00478500; FUN_00478500.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00478500(int param_1)

{
  int iVar1;
  bool bVar2;
  char cVar3;
  uint uVar4;
  uint *puVar5;
  int iVar6;
  int iVar7;
  ushort local_16;
  ushort local_14;
  undefined1 local_12;
  undefined1 local_11;
  uint local_10 [4];

  bVar2 = false;
  puVar5 = local_10;
  do {
    if (bVar2) {
      return;
    }
    uVar4 = FUN_00436c20();
    *puVar5 = uVar4 & 0xffff;
    if ((uVar4 & 0xffff) == 0) {
      bVar2 = true;
    }
    puVar5 = puVar5 + 1;
  } while (puVar5 < &stack0x00000000);
  if (!bVar2) {
    puVar5 = local_10;
    local_16 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                        (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
    local_12 = 0xe;
    local_14 = local_16;
    local_11 = 0xe;
    do {
      uVar4 = *puVar5;
      puVar5 = puVar5 + 1;
      FUN_00438730(uVar4,0xb,&local_14,0);
    } while (puVar5 < &stack0x00000000);
    iVar7 = 0;
    iVar6 = 0x89d1c8;
    if (game_state.num_tribes != 0) {
      do {
        cVar3 = FUN_00419480(iVar7);
        if (cVar3 == '\0') {
          for (iVar1 = *(int *)(iVar6 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
            if (*(char *)(iVar1 + 0x2b) != '\a') {
              uVar4 = local_10[iVar7];
              *(uint *)(iVar1 + 0xc) = *(uint *)(iVar1 + 0xc) | 0x10;
              FUN_00436d00(iVar1,uVar4,0);
            }
          }
          FUN_0048a050(*(undefined4 *)(iVar6 + 0x881),0x30,0);
        }
        iVar7 = iVar7 + 1;
        iVar6 = iVar6 + 0xc65;
      } while (iVar7 < (int)(uint)game_state.num_tribes);
    }
  }
  return;
}
