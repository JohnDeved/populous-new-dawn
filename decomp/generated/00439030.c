/* Ghidra 12.1.3 pseudocode; entry 00439030; FUN_00439030.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004390f4) */
/* WARNING: Removing unreachable block (ram,0x004390fe) */

undefined1 FUN_00439030(int param_1)

{
  unit_struct *puVar1;
  bool bVar2;
  ushort uVar3;
  uint uVar4;
  uint uVar5;
  undefined1 uVar6;
  short local_8;
  short local_6;
  short local_4;
  short local_2;

  uVar6 = 0;
  if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
    uVar4 = *(uint *)(param_1 + 0x10) & 0xfffefff8;
    *(uint *)(param_1 + 0x10) = uVar4;
    *(uint *)(param_1 + 0x10) = uVar4 | 4;
    puVar1 = unit_land_array[*(ushort *)(param_1 + 0x89)];
    get_building_coords(puVar1,&local_8);
    FUN_004044b0(puVar1,&local_4);
    uVar4 = (int)local_4 - (int)*(short *)(param_1 + 0x3d);
    uVar5 = (int)uVar4 >> 0x1f;
    if (((int)((uVar4 ^ uVar5) - uVar5) < 0x138) &&
       (uVar4 = (int)local_2 - (int)*(short *)(param_1 + 0x3f), uVar5 = (int)uVar4 >> 0x1f,
       (int)((uVar4 ^ uVar5) - uVar5) < 0x138)) {
      FUN_004e9dd0(param_1,&local_8);
    }
    else {
      FUN_004e9d80(param_1,&local_8);
    }
    uVar4 = (uint)(ushort)(local_8 - *(short *)(param_1 + 0x3d));
    uVar5 = (uint)(ushort)(local_6 - *(short *)(param_1 + 0x3f));
    if (0x7fff < uVar4) {
      uVar4 = uVar4 - 0x10000;
    }
    if (0x7fff < uVar5) {
      uVar5 = uVar5 - 0x10000;
    }
    uVar3 = calc_angle_quadrant(uVar4,-uVar5);
    uVar3 = uVar3 & 0x7ff;
    if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
      *(ushort *)(param_1 + 0x57) = uVar3;
    }
    *(ushort *)(param_1 + 0x5d) = uVar3;
    if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
      uVar3 = uVar3 + 0x400 & 0x7ff;
    }
    *(ushort *)(param_1 + 0x26) = uVar3;
    FUN_004d4f40(param_1);
  }
  if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
    uVar4 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar5 = (int)uVar4 >> 0x1f;
    if ((0x6f < (int)((uVar4 ^ uVar5) - uVar5)) ||
       (uVar4 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar5 = (int)uVar4 >> 0x1f, bVar2 = true, 0x6f < (int)((uVar4 ^ uVar5) - uVar5))) {
      bVar2 = false;
    }
    if (bVar2) {
      uVar6 = 1;
    }
  }
  return uVar6;
}
