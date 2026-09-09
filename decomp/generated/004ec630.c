/* Ghidra 12.1.3 pseudocode; entry 004ec630; FUN_004ec630.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ec630(short *param_1,short param_2)

{
  ushort uVar1;

  uVar1 = FUN_004655f0(param_1);
  if (param_2 != 0) {
    uVar1 = (uVar1 & 7) << 8;
    *param_1 = *param_1 + (short)((uint)(maybe_sin[uVar1] * (int)param_2) >> 0x10);
    param_1[1] = param_1[1] + (short)((uint)(maybe_cos[uVar1] * (int)param_2) >> 0x10);
  }
  return;
}
