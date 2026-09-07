/* Ghidra 12.1.3 pseudocode; entry 004c2aa0; FUN_004c2aa0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004c2aa0(int param_1,int param_2)

{
  byte *pbVar1;
  byte bVar2;
  byte bVar3;

  pbVar1 = (byte *)(param_2 + 0x96071e + param_1 * 0x38);
  bVar2 = (*pbVar1 >> 4) + 1;
  if (0xf < bVar2) {
    bVar2 = 0xf;
  }
  bVar3 = *pbVar1 & 0xf;
  *pbVar1 = bVar3;
  *pbVar1 = bVar2 << 4 | bVar3;
  return;
}
