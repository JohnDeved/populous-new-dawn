/* Ghidra 12.1.3 pseudocode; entry 004623e0; maybe_ai_func_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void maybe_ai_func_1(int param_1)

{
  int iVar1;
  char cVar2;
  uint uVar3;

  iVar1 = 0;
  do {
    if ((*(uint *)((uint)*(byte *)(param_1 + 0x5b5) * 0x52 + 0x74 + param_1) & 1) != 0) break;
    iVar1 = iVar1 + 1;
    cVar2 = *(byte *)(param_1 + 0x5b5) + 1;
    *(char *)(param_1 + 0x5b5) = cVar2;
    if (cVar2 == '\n') {
      *(undefined1 *)(param_1 + 0x5b5) = 0;
    }
  } while (iVar1 < 10);
  if (iVar1 != 10) {
    uVar3 = (uint)*(byte *)(param_1 + 0x5b5);
    switch(*(undefined1 *)(uVar3 * 0x52 + 0x85 + param_1)) {
    case 0:
      FUN_004c6da0(param_1,uVar3);
      break;
    case 1:
      FUN_004c7a60(param_1,uVar3);
      break;
    case 2:
      FUN_004c7370(param_1,uVar3);
      break;
    case 3:
      FUN_004c81a0(param_1,uVar3);
      break;
    case 4:
      FUN_004ccb40(param_1,uVar3);
      break;
    case 5:
      FUN_004c8070(param_1,uVar3);
      break;
    case 6:
      FUN_004c8490(param_1,uVar3);
      break;
    case 7:
      FUN_004c8910(param_1,uVar3);
      break;
    case 8:
      FUN_004c5f70(param_1,uVar3);
      break;
    case 9:
      FUN_004c5cf0(param_1,uVar3);
      break;
    case 0xb:
      FUN_004c8c50(param_1,uVar3);
      break;
    case 0xd:
      FUN_004c9340(param_1,uVar3);
      break;
    case 0xe:
      FUN_004c9580(param_1,uVar3);
      break;
    case 0xf:
      FUN_004c8fe0(param_1,uVar3);
      break;
    case 0x10:
      FUN_004c9920(param_1,uVar3);
      break;
    case 0x11:
      FUN_004c9bf0(param_1,uVar3);
      break;
    case 0x12:
      FUN_004ca320(param_1,uVar3);
      break;
    case 0x13:
      FUN_004caac0(param_1,uVar3);
      break;
    case 0x14:
      FUN_004cb400(param_1,uVar3);
      break;
    case 0x18:
      FUN_004cedd0(param_1,uVar3);
      break;
    case 0x19:
      FUN_004cf2e0(param_1,uVar3);
      break;
    case 0x1a:
      FUN_004cf4c0(param_1,uVar3);
      break;
    case 0x1b:
      FUN_004cf970(param_1,uVar3);
      break;
    case 0x1c:
      FUN_004d04c0(param_1,uVar3);
    }
  }
  cVar2 = *(char *)(param_1 + 0x5b5) + '\x01';
  *(char *)(param_1 + 0x5b5) = cVar2;
  if (cVar2 == '\n') {
    *(undefined1 *)(param_1 + 0x5b5) = 0;
  }
  return;
}
