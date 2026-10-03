/* Ghidra 12.1.3 pseudocode; entry 0050c780; FUN_0050c780.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050c780(int param_1)

{
  uint uVar1;
  undefined2 uVar2;
  int iVar3;

  uVar1 = *(uint *)((int)&DAT_0089db05 + *(char *)(param_1 + 0x2f) * 0xc65);
  iVar3 = *(char *)(param_1 + 0x2f) * 0xc65;
  if ((uVar1 & 1) == 0) {
    *(uint *)((int)&DAT_0089db05 + iVar3) = uVar1 | 1;
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      FUN_004ed6f0(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 7;
      FUN_004ed640(param_1);
    }
    uVar2 = FUN_004ba600((int)*(short *)(param_1 + 0x41));
    *(undefined2 *)(param_1 + 0x41) = uVar2;
    *(undefined2 *)((int)&DAT_0089dadd + iVar3) = uVar2;
    iVar3 = FUN_0048a050(param_1,0x9e,0);
    if (iVar3 != 0) {
      FUN_0048a810(iVar3,0);
      return;
    }
  }
  else {
    FUN_004edcf0(param_1);
  }
  return;
}
