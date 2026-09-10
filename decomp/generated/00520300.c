/* Ghidra 12.1.3 pseudocode; entry 00520300; FUN_00520300.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00520349) */
/* WARNING: Removing unreachable block (ram,0x00520353) */

undefined1 FUN_00520300(int param_1,undefined4 param_2,int param_3)

{
  char cVar1;
  unit_struct *puVar2;
  char cVar3;
  bool bVar4;
  ushort uVar5;
  uint uVar6;
  uint uVar7;
  undefined1 local_5;
  undefined1 local_4 [4];

  local_5 = 0;
  *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfff7;
  cVar1 = *(char *)(param_1 + 0x2b);
  if (cVar1 == '\x06') {
    puVar2 = unit_land_array[param_3];
    uVar7 = (uint)(ushort)((puVar2->pos).x - *(short *)(param_1 + 0x3d));
    uVar6 = (uint)(ushort)((puVar2->pos).y - *(short *)(param_1 + 0x3f));
    if (0x7fff < uVar7) {
      uVar7 = uVar7 - 0x10000;
    }
    if (0x7fff < uVar6) {
      uVar6 = uVar6 - 0x10000;
    }
    uVar5 = calc_angle_quadrant(uVar7,-uVar6);
    uVar5 = uVar5 & 0x7ff;
    if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
      *(ushort *)(param_1 + 0x57) = uVar5;
    }
    *(ushort *)(param_1 + 0x5d) = uVar5;
    if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
      uVar5 = uVar5 + 0x400 & 0x7ff;
    }
    *(ushort *)(param_1 + 0x26) = uVar5;
    cVar3 = FUN_0051f990(param_1,puVar2,0);
    if (cVar3 != '\0') {
      if ((*(short *)(param_1 + 0x9f) == 0) || (bVar4 = true, (*(byte *)(param_1 + 0x13) & 2) == 0))
      {
        bVar4 = false;
      }
      if (!bVar4) {
        FUN_004d4ee0(param_1);
        FUN_004e9d80(param_1,param_1 + 0x3d);
      }
      goto LAB_00520449;
    }
    uVar7 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar6 = (int)uVar7 >> 0x1f;
    if ((0x237 < (int)((uVar7 ^ uVar6) - uVar6)) ||
       (uVar7 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar6 = (int)uVar7 >> 0x1f, bVar4 = true, 0x237 < (int)((uVar7 ^ uVar6) - uVar6))) {
      bVar4 = false;
    }
    if (bVar4) {
      local_5 = 1;
      goto LAB_00520449;
    }
    if ((*(short *)(param_1 + 0x9f) != 0) && ((*(byte *)(param_1 + 0x13) & 2) == 0)) {
      local_5 = 1;
      goto LAB_00520449;
    }
  }
  FUN_004d4f40(param_1);
LAB_00520449:
  if (cVar1 != '\x06') {
    FUN_004389c0(param_2,local_4);
    FUN_00435550(param_1,local_4,1);
  }
  return local_5;
}
