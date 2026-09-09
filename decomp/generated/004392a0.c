/* Ghidra 12.1.3 pseudocode; entry 004392a0; FUN_004392a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004392fb) */
/* WARNING: Removing unreachable block (ram,0x00439305) */

undefined4 FUN_004392a0(int param_1)

{
  vector_48b *pvVar1;
  ushort extraout_AX;
  ushort uVar2;
  undefined4 in_EAX;
  undefined2 uVar6;
  uint uVar3;
  undefined2 extraout_var;
  unit_struct *puVar4;
  int iVar5;
  unit_struct *puVar7;
  uint uVar8;
  undefined1 uVar9;

  uVar9 = 0;
  uVar6 = (undefined2)((uint)in_EAX >> 0x10);
  if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
    FUN_004d4f40(param_1);
    puVar4 = unit_land_array[*(short *)(param_1 + 0x72)];
    pvVar1 = &puVar4->pos;
    FUN_004e9d80(param_1,pvVar1);
    uVar8 = (uint)(ushort)(pvVar1->x - *(short *)(param_1 + 0x3d));
    uVar3 = (uint)(ushort)((puVar4->pos).y - *(short *)(param_1 + 0x3f));
    if (0x7fff < uVar8) {
      uVar8 = uVar8 - 0x10000;
    }
    if (0x7fff < uVar3) {
      uVar3 = uVar3 - 0x10000;
    }
    calc_angle_quadrant(uVar8,-uVar3);
    uVar2 = extraout_AX & 0x7ff;
    if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
      *(ushort *)(param_1 + 0x57) = uVar2;
    }
    *(ushort *)(param_1 + 0x5d) = uVar2;
    if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
      uVar2 = uVar2 + 0x400 & 0x7ff;
    }
    *(ushort *)(param_1 + 0x26) = uVar2;
    uVar6 = extraout_var;
  }
  uVar2 = *(ushort *)(param_1 + 0x72);
  puVar4 = (unit_struct *)CONCAT22(uVar6,uVar2);
  puVar7 = (unit_struct *)0x0;
  if (((uVar2 != 0) && (puVar4 = unit_land_array[uVar2], (*(byte *)&puVar4->flags_2 & 1) == 0)) &&
     (puVar4->unit_class != '\0')) {
    puVar7 = puVar4;
  }
  if (puVar7 == (unit_struct *)0x0) {
    uVar9 = 2;
  }
  else if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
    uVar8 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar3 = (int)uVar8 >> 0x1f;
    puVar4 = (unit_struct *)((uVar8 ^ uVar3) - uVar3);
    if ((0x6f < (int)puVar4) ||
       (uVar8 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar3 = (int)uVar8 >> 0x1f, iVar5 = (uVar8 ^ uVar3) - uVar3,
       puVar4 = (unit_struct *)CONCAT31((int3)((uint)iVar5 >> 8),1), 0x6f < iVar5)) {
      puVar4 = (unit_struct *)((uint)puVar4 & 0xffffff00);
    }
    if ((char)puVar4 != '\0') {
      return CONCAT31((int3)((uint)puVar4 >> 8),1);
    }
  }
  return CONCAT31((int3)((uint)puVar4 >> 8),uVar9);
}
