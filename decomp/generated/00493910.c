/* Ghidra 12.1.3 pseudocode; entry 00493910; FUN_00493910.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00493910(int param_1,int *param_2,int param_3,char param_4,undefined4 param_5)

{
  int *piVar1;
  undefined2 *puVar2;
  bool bVar3;
  int iVar4;
  int iVar5;
  byte bVar6;
  undefined1 local_1;

  local_1 = 2;
  if (param_1 != -1) {
    param_1 = param_1 * 0x18;
    if (((&game_state.field_0x9d62b)[param_1] & 1) != 0) {
      *(undefined2 *)(&game_state.field_0x9d636 + param_1) = 0;
      *(undefined2 *)(&game_state.field_0x9d638 + param_1) = *(undefined2 *)(param_3 + 0x24);
      if ((param_4 == '\0') || (((&game_state.field_0x9d62b)[param_1] & 2) == 0)) {
        local_1 = 3;
        for (puVar2 = *(undefined2 **)(&game_state.field_0x9d63c + param_1);
            puVar2 != (undefined2 *)0x0; puVar2 = *(undefined2 **)(puVar2 + 5)) {
          iVar4 = FUN_00493d50(*puVar2,(&game_state.field_0x9d62a)[param_1]);
          if (iVar4 == 0) {
            if ((*(byte *)(puVar2 + 2) & 2) == 0) {
              *(short *)(&game_state.field_0x9d632 + param_1) =
                   *(short *)(&game_state.field_0x9d632 + param_1) + -1;
              game_state._644608_4_ = game_state._644608_4_ + -1;
            }
            *(byte *)(puVar2 + 2) = *(byte *)(puVar2 + 2) & 0xfe;
            piVar1 = (int *)(puVar2 + 5);
            if (*(int *)(puVar2 + 3) == 0) {
              *(int *)(&game_state.field_0x9d63c + param_1) = *piVar1;
            }
            else {
              *(int *)(*(int *)(puVar2 + 3) + 10) = *piVar1;
            }
            if (*piVar1 != 0) {
              *(undefined4 *)(*piVar1 + 6) = *(undefined4 *)(puVar2 + 3);
            }
            *(short *)(&game_state.field_0x9d630 + param_1) =
                 *(short *)(&game_state.field_0x9d630 + param_1) + -1;
          }
        }
        bVar6 = 0;
        FUN_00495390(param_1 + 0x93a7a0);
        *(undefined2 *)(&game_state.field_0x9d634 + param_1) = 0;
        if (*(short *)(&game_state.field_0x9d630 + param_1) != 0) {
          bVar3 = false;
          do {
            if (bVar3) {
              return local_1;
            }
            for (iVar4 = *(int *)(&game_state.field_0x9d63c + param_1); iVar4 != 0;
                iVar4 = *(int *)(iVar4 + 10)) {
              if ((*(byte *)(iVar4 + 4) & 4) == 0) {
                iVar5 = FUN_00494360(param_1 + 0x93a7a0,iVar4,param_5,bVar6 == 0);
                *param_2 = iVar5;
                if (iVar5 != 0) {
                  local_1 = 0;
                  bVar3 = true;
                  break;
                }
              }
            }
            bVar6 = bVar6 + 1;
          } while (bVar6 < 2);
        }
      }
      else {
        local_1 = 1;
      }
    }
  }
  return local_1;
}
