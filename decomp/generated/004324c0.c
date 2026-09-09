/* Ghidra 12.1.3 pseudocode; entry 004324c0; FUN_004324c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004324e3) */
/* WARNING: Removing unreachable block (ram,0x004324ed) */

uint FUN_004324c0(short *param_1,short *param_2)

{
  uint uVar1;
  uint uVar2;

  uVar2 = (uint)(ushort)(*param_2 - *param_1);
  uVar1 = (uint)(ushort)(param_2[1] - param_1[1]);
  if (0x7fff < uVar2) {
    uVar2 = uVar2 - 0x10000;
  }
  if (0x7fff < uVar1) {
    uVar1 = uVar1 - 0x10000;
  }
  uVar2 = calc_angle_quadrant(uVar2,-uVar1);
  return uVar2 & 0xffff07ff;
}
