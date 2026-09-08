/* Ghidra 12.1.3 pseudocode; entry 00478820; FUN_00478820.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00478820(int param_1,int param_2)

{
  int iVar1;

  if ((1 < *(byte *)(param_1 + 0x2d)) && (*(short *)(param_1 + 0x7a) == 0)) {
    iVar1 = calc_squared_distance_toroidal(param_1 + 0x3d,param_2 + 0x3d);
    if (0x1440000 < iVar1) {
      *(undefined2 *)(param_2 + 0x6e) = 0;
    }
  }
  return;
}
