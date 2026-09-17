/* Ghidra 12.1.3 pseudocode; entry 004782d0; FUN_004782d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004782d0(void)

{
  int iVar1;
  char cVar2;
  short sVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  uint local_4;

  iVar5 = 0x89d1c8;
  iVar6 = 0;
  if (game_state.num_tribes != 0) {
    do {
      cVar2 = FUN_00419480(iVar6);
      if (cVar2 == '\0') {
        if (*(int *)(iVar5 + 0x89d) != 0) {
          *(undefined2 *)(*(int *)(iVar5 + 0x89d) + 0x74) = 0;
        }
        sVar3 = 1;
        iVar4 = 0;
        do {
          switch(iVar4) {
          case 0:
            local_4 = 3;
            break;
          case 1:
            local_4 = 2;
            break;
          case 2:
            local_4 = 4;
            break;
          case 3:
            local_4 = 5;
            break;
          case 4:
            local_4 = 6;
          }
          for (iVar1 = *(int *)(iVar5 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
            if (*(byte *)(iVar1 + 0x2b) == local_4) {
              *(short *)(iVar1 + 0x74) = sVar3;
              sVar3 = sVar3 + 1;
            }
          }
          iVar4 = iVar4 + 1;
        } while (iVar4 < 5);
      }
      iVar6 = iVar6 + 1;
      iVar5 = iVar5 + 0xc65;
    } while (iVar6 < (int)(uint)game_state.num_tribes);
  }
  return;
}
