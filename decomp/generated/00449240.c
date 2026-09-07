/* Ghidra 12.1.3 pseudocode; entry 00449240; FUN_00449240.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00449240(char param_1,undefined2 param_2,short param_3,undefined2 param_4,char param_5)

{
  char *pcVar1;
  char *pcVar2;
  char *pcVar3;

  if (((game_state._838239_1_ & 1) == 0) && (game_state.start_15_count < ' ')) {
    pcVar2 = &game_state.start_15_1;
    pcVar1 = (char *)0x0;
    do {
      pcVar3 = pcVar1;
      if (pcVar1 != (char *)0x0) goto LAB_004492b5;
      pcVar3 = pcVar2;
      if ((*pcVar2 != '\0') && (pcVar3 = pcVar1, param_3 < *(short *)(pcVar2 + 4))) {
        for (pcVar1 = (char *)(game_state.start_14 + game_state.start_15_count * 2 + 0x44);
            pcVar3 = pcVar2, pcVar2 <= pcVar1; pcVar1 = pcVar1 + -8) {
          *(undefined4 *)(pcVar1 + 8) = *(undefined4 *)pcVar1;
          *(undefined4 *)(pcVar1 + 0xc) = *(undefined4 *)(pcVar1 + 4);
        }
      }
      pcVar2 = pcVar2 + 8;
      pcVar1 = pcVar3;
    } while (pcVar2 < &game_state.start_16);
    if (pcVar3 != (char *)0x0) {
LAB_004492b5:
      game_state.start_15_count = game_state.start_15_count + '\x01';
      *pcVar3 = param_1;
      *(undefined2 *)(pcVar3 + 2) = param_2;
      pcVar3[1] = param_5;
      *(short *)(pcVar3 + 4) = param_3;
      *(undefined2 *)(pcVar3 + 6) = param_4;
    }
  }
  return;
}
