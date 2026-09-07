/* Ghidra 12.1.3 pseudocode; entry 00586000; fast_sqrt.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined8 __fastcall fast_sqrt(undefined4 param_1,undefined4 param_2,uint param_3)

{
  int iVar1;
  uint uVar2;

  if (param_3 == 0) {
    uVar2 = 0;
  }
  else {
    iVar1 = 0x1f;
    if (param_3 != 0) {
      for (; param_3 >> iVar1 == 0; iVar1 = iVar1 + -1) {
      }
    }
    for (uVar2 = (uint)(ushort)sqrt_table[iVar1]; (int)(param_3 / uVar2) < (int)uVar2;
        uVar2 = uVar2 + param_3 / uVar2 >> 1) {
    }
  }
  return CONCAT44(param_2,uVar2);
}
