/* Ghidra 12.1.3 pseudocode; entry 004e9b70; calc_angular_diff_shortest.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int calc_angular_diff_shortest(short param_1,short param_2)

{
  int iVar1;

  iVar1 = (int)param_1 - (int)param_2;
  if (iVar1 < 0) {
    iVar1 = -iVar1;
  }
  if (0x400 < iVar1) {
    iVar1 = 0x800 - iVar1;
  }
  return iVar1;
}
