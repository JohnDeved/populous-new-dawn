/* Ghidra 12.1.3 pseudocode; entry 00439850; FUN_00439850.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004398be) */
/* WARNING: Removing unreachable block (ram,0x004398c8) */

undefined4 FUN_00439850(int param_1,int param_2)

{
  vector_48b *pvVar1;
  short *psVar2;
  int iVar3;
  unit_struct *puVar4;
  ushort uVar5;
  uint uVar6;
  uint uVar7;
  unit_struct *puVar8;
  undefined1 uVar9;

  uVar9 = 0;
  if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
    uVar6 = *(uint *)(param_1 + 0x10) & 0xfffefff8;
    *(uint *)(param_1 + 0x10) = uVar6;
    *(uint *)(param_1 + 0x10) = uVar6 | 0x10000;
    FUN_004d4f40(param_1);
    puVar8 = unit_land_array[*(short *)(param_1 + 0x72)];
    pvVar1 = &puVar8->pos;
    FUN_004e9d80(param_1,pvVar1);
    uVar6 = (uint)(ushort)(pvVar1->x - *(short *)(param_1 + 0x3d));
    uVar7 = (uint)(ushort)((puVar8->pos).y - *(short *)(param_1 + 0x3f));
    if (0x7fff < uVar6) {
      uVar6 = uVar6 - 0x10000;
    }
    if (0x7fff < uVar7) {
      uVar7 = uVar7 - 0x10000;
    }
    uVar5 = calc_angle_quadrant(uVar6,-uVar7);
    uVar5 = uVar5 & 0x7ff;
    uVar6 = *(uint *)(param_1 + 0xc);
    if ((uVar6 & 0x80) != 0) {
      *(ushort *)(param_1 + 0x57) = uVar5;
    }
    *(ushort *)(param_1 + 0x5d) = uVar5;
    if ((uVar6 & 0x8000) != 0) {
      uVar5 = uVar5 + 0x400 & 0x7ff;
    }
    *(ushort *)(param_1 + 0x26) = uVar5;
    *(uint *)(param_1 + 0xc) = uVar6 | 0x200;
  }
  puVar8 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0x72) != 0) &&
      (puVar4 = unit_land_array[*(ushort *)(param_1 + 0x72)], (*(byte *)&puVar4->flags_2 & 1) == 0))
     && (puVar4->unit_class != '\0')) {
    puVar8 = puVar4;
  }
  if ((puVar8 != (unit_struct *)0x0) &&
     ((puVar8->unit_land_array_index == 0 ||
      ((unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x31 & 0x20) != 0)))) {
    psVar2 = (short *)(param_1 + 0x70);
    *psVar2 = *psVar2 + -1;
    if (*psVar2 != 0) {
      iVar3 = param_2 / 2 + 0x38;
      uVar6 = (int)*(short *)(param_1 + 0x4f) - (int)(short)(puVar8->pos).x;
      uVar7 = (int)uVar6 >> 0x1f;
      if ((iVar3 <= (int)((uVar6 ^ uVar7) - uVar7)) ||
         (uVar6 = (int)*(short *)(param_1 + 0x51) - (int)(short)(puVar8->pos).y,
         uVar7 = (int)uVar6 >> 0x1f, iVar3 <= (int)((uVar6 ^ uVar7) - uVar7))) {
        FUN_004e9d80(param_1,&puVar8->pos);
      }
      uVar6 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
      uVar7 = (int)uVar6 >> 0x1f;
      if (((int)((uVar6 ^ uVar7) - uVar7) < param_2 + 0x38) &&
         (uVar6 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
         uVar7 = (int)uVar6 >> 0x1f, (int)((uVar6 ^ uVar7) - uVar7) < param_2 + 0x38)) {
        uVar9 = 1;
      }
      goto LAB_004399e2;
    }
  }
  uVar9 = 2;
LAB_004399e2:
  uVar6 = *(uint *)(param_1 + 0x10);
  if ((uVar6 & 0x10000000) != 0) {
    uVar6 = uVar6 & 0xefffffff;
    uVar9 = 3;
    *(uint *)(param_1 + 0x10) = uVar6;
  }
  return CONCAT31((int3)(uVar6 >> 8),uVar9);
}
