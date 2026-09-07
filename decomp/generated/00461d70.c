/* Ghidra 12.1.3 pseudocode; entry 00461d70; FUN_00461d70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00461d70(int param_1)

{
  int iVar1;
  undefined1 *puVar2;
  undefined4 *puVar3;
  undefined4 *puVar4;

  puVar3 = (undefined4 *)(param_1 + 0x36);
  for (iVar1 = 0x164; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  *(undefined2 *)puVar3 = 0;
  *(undefined1 *)((int)puVar3 + 2) = 0;
  puVar3 = null_ARRAY_0059d878;
  puVar4 = (undefined4 *)(param_1 + 0x36e);
  for (iVar1 = 0x3c; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar4 = *puVar3;
    puVar3 = puVar3 + 1;
    puVar4 = puVar4 + 1;
  }
  *(undefined4 *)(param_1 + 0x59e) = 0xffffffff;
  *(undefined1 *)(param_1 + 0x5be) = 0xb;
  FUN_004f52c0(param_1);
  *(undefined1 *)(param_1 + 0x5b4) = 0;
  iVar1 = 10;
  puVar2 = (undefined1 *)(param_1 + 0x476);
  do {
    *puVar2 = 0xff;
    iVar1 = iVar1 + -1;
    puVar2[1] = 0xff;
    puVar2 = puVar2 + 8;
  } while (iVar1 != 0);
  puVar2 = (undefined1 *)(param_1 + 0x4ce);
  iVar1 = 8;
  do {
    *puVar2 = 0;
    puVar2 = puVar2 + 0xc;
    iVar1 = iVar1 + -1;
  } while (iVar1 != 0);
  FUN_004d1420(param_1);
  iVar1 = 0x16;
  *(undefined1 *)((int)game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0x30 + -5) = 0xc;
  puVar2 = (undefined1 *)(param_1 + 0x53f);
  do {
    *puVar2 = 1;
    puVar2 = puVar2 + 4;
    iVar1 = iVar1 + -1;
  } while (iVar1 != 0);
  game_state.start_n1[*(char *)(param_1 + 0xc22) * 0xc42 + 0x26] =
       *(char *)(param_1 + 0xc22) * 0x3108 + 0x95f7b2;
  if (*(short *)(&game_state.field_0xc063c + *(char *)(param_1 + 0xc22) * 0x3108) != 0x3eb) {
    *(short *)(&game_state.field_0xc063c + *(char *)(param_1 + 0xc22) * 0x3108) = 0x3eb;
    *(undefined2 *)(&game_state.field_0xc063e + *(char *)(param_1 + 0xc22) * 0x3108) = 0x3ec;
    *(undefined2 *)(&game_state.field_0xc0640 + *(char *)(param_1 + 0xc22) * 0x3108) = 0x3fb;
  }
  return;
}
