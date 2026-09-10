/* Ghidra 12.1.3 pseudocode; entry 00451ac0; FUN_00451ac0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00451ac0(int param_1,ushort *param_2,int param_3)

{
  int iVar1;
  undefined1 uVar2;
  short local_4;
  short local_2;

  uVar2 = 0;
  if (*(char *)(param_1 + 0x2b) == '\a') {
    return 1;
  }
  if (param_3 == 0) {
    uVar2 = 1;
  }
  else {
    local_4 = (*param_2 & 0xfe00) + 0x100;
    local_2 = (param_2[1] & 0xfe00) + 0x100;
    iVar1 = calc_squared_distance_toroidal(param_1 + 0x3d,&local_4);
    if (iVar1 < 0x2400000) {
      return 1;
    }
  }
  return uVar2;
}
