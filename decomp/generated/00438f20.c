/* Ghidra 12.1.3 pseudocode; entry 00438f20; FUN_00438f20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00438f8a) */
/* WARNING: Removing unreachable block (ram,0x00438f94) */

undefined1 FUN_00438f20(int param_1,int param_2)

{
  ushort uVar1;
  uint uVar2;
  undefined1 uVar3;
  uint uVar4;
  short local_4;
  short local_2;

  uVar3 = 0;
  if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
    FUN_004044b0(unit_land_array[*(ushort *)(param_1 + 0x89)],&local_4);
    FUN_004e9d80(param_1,&local_4);
    uVar4 = (uint)(ushort)(local_4 - *(short *)(param_1 + 0x3d));
    uVar2 = (uint)(ushort)(local_2 - *(short *)(param_1 + 0x3f));
    if (0x7fff < uVar4) {
      uVar4 = uVar4 - 0x10000;
    }
    if (0x7fff < uVar2) {
      uVar2 = uVar2 - 0x10000;
    }
    uVar1 = calc_angle_quadrant(uVar4,-uVar2);
    uVar1 = uVar1 & 0x7ff;
    if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
      *(ushort *)(param_1 + 0x57) = uVar1;
    }
    *(ushort *)(param_1 + 0x5d) = uVar1;
    if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
      uVar1 = uVar1 + 0x400 & 0x7ff;
    }
    *(ushort *)(param_1 + 0x26) = uVar1;
    FUN_004d4f40(param_1);
  }
  if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
    uVar4 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar2 = (int)uVar4 >> 0x1f;
    if (((int)((uVar4 ^ uVar2) - uVar2) < param_2 + 0x38) &&
       (uVar4 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar2 = (int)uVar4 >> 0x1f, (int)((uVar4 ^ uVar2) - uVar2) < param_2 + 0x38)) {
      uVar3 = 1;
    }
  }
  return uVar3;
}
