/* Ghidra 12.1.3 pseudocode; entry 004c2a50; struct_56B_spell_dec.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void struct_56B_spell_dec(int param_1,int param_2)

{
  byte *pbVar1;
  byte bVar2;
  uint uVar3;
  int iVar4;

  pbVar1 = (byte *)(param_2 + 0x96071e + param_1 * 0x38);
  uVar3 = (uint)(*pbVar1 >> 4);
  if (uVar3 != 0) {
    iVar4 = uVar3 - 1;
    if (0xf < iVar4) {
      iVar4 = 0xf;
    }
    bVar2 = *pbVar1 & 0xf;
    *pbVar1 = bVar2;
    *pbVar1 = (char)iVar4 << 4 | bVar2;
  }
  return;
}
