/* Ghidra 12.1.3 pseudocode; entry 004f6800; FUN_004f6800.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


byte FUN_004f6800(int param_1,byte param_2)

{
  byte bVar1;

  bVar1 = *(byte *)(param_1 + 0xc22);
  if ((bVar1 != 0xff) && (param_2 != 0xff)) {
    if (bVar1 != param_2) {
      return *(byte *)((int)&DAT_009608b6 + (int)(char)bVar1) & '\x01' << (param_2 & 0x1f);
    }
    return 1;
  }
  return 1;
}
