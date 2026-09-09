/* Ghidra 12.1.3 pseudocode; entry 004043f0; FUN_004043f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004043f0(int param_1,int param_2)

{
  int iVar1;

  iVar1 = (int)*(short *)(param_1 + 0x41);
  if (((0xc < *(byte *)(param_1 + 0x9e)) && (*(byte *)(param_1 + 0x9e) < 0xf)) &&
     ((*(byte *)(param_2 + 6) & 0x80) != 0)) {
    iVar1 = 0;
  }
  return iVar1;
}
