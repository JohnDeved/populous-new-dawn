/* Ghidra 12.1.3 pseudocode; entry 004d5c70; FUN_004d5c70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d5c70(int param_1)

{
  uint uVar1;
  undefined4 uVar2;

  if ((*(uint *)(param_1 + 0x10) & 0x800) == 0) {
    if ((*(uint *)(param_1 + 0x10) & 0x4000) != 0) {
      *(undefined1 *)(param_1 + 0x2f) = *(undefined1 *)(param_1 + 0xad);
    }
    if (*(char *)(param_1 + 0x2b) == '\a') {
      if (*(char *)(param_1 + 0x2f) == player_tribe_num) {
        uVar2 = 0xf;
      }
      else {
        uVar2 = 0x88;
      }
    }
    else {
      uVar2 = 0x10;
    }
    FUN_0048a050(param_1,uVar2,0);
    *(undefined2 *)(param_1 + 0x5f) = 0;
    uVar1 = *(uint *)(param_1 + 0xc);
    *(undefined2 *)(param_1 + 0x6e) = 0;
    *(undefined2 *)(param_1 + 0x72) = 0;
    *(uint *)(param_1 + 0xc) = uVar1 | 0x10000;
    *(uint *)(param_1 + 0xc) = uVar1 | 0x110000;
    return;
  }
  FUN_004ef180(param_1);
  return;
}
