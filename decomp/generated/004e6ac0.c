/* Ghidra 12.1.3 pseudocode; entry 004e6ac0; FUN_004e6ac0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e6ac0(short *param_1,ushort param_2,ushort param_3,int param_4)

{
  int iVar1;

  if (param_4 != 0) {
    param_1[2] = param_1[2] + (short)((uint)(maybe_cos[param_3 & 0x7ff] * (param_4 >> 1)) >> 0x10);
    iVar1 = maybe_sin[param_3 & 0x7ff] * param_4 >> 0x10;
    if (iVar1 != 0) {
      *param_1 = *param_1 + (short)((uint)(maybe_sin[param_2 & 0x7ff] * iVar1) >> 0x10);
      param_1[1] = param_1[1] + (short)((uint)(maybe_cos[param_2 & 0x7ff] * iVar1) >> 0x10);
    }
  }
  return;
}
