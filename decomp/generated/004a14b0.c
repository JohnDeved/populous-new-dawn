/* Ghidra 12.1.3 pseudocode; entry 004a14b0; FUN_004a14b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a14b0(int param_1)

{
  uint uVar1;
  undefined4 uVar2;
  uint uVar3;

  uVar1 = *(uint *)(param_1 + 99);
  uVar3 = (int)uVar1 >> 0x1f;
  uVar2 = 1;
  if (7 < (int)uVar1) {
    uVar2 = 3;
  }
  func_0x004deb40(uVar2,((uVar1 ^ uVar3) - uVar3 & 7 ^ uVar3) - uVar3);
  return;
}
