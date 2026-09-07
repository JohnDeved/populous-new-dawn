/* Ghidra 12.1.3 pseudocode; entry 004df220; FUN_004df220.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004df2a2) */
/* WARNING: Removing unreachable block (ram,0x004df2ac) */

undefined1 FUN_004df220(int param_1)

{
  char cVar1;
  unit_struct *puVar2;
  bool bVar3;
  bool bVar4;
  ushort uVar5;
  short sVar6;
  uint uVar7;
  uint uVar8;
  undefined1 uVar9;
  unit_struct *puVar10;

  uVar9 = 0;
  puVar10 = (unit_struct *)0x0;
  bVar4 = false;
  if (((*(ushort *)(param_1 + 0x72) != 0) &&
      (puVar2 = unit_land_array[*(ushort *)(param_1 + 0x72)], (*(byte *)&puVar2->flags_2 & 1) == 0))
     && (puVar2->unit_class != '\0')) {
    puVar10 = puVar2;
  }
  if (puVar10 != (unit_struct *)0x0) {
    cVar1 = *(char *)(param_1 + 0x2d);
    if (cVar1 == '\0') {
      *(byte *)(param_1 + 0x77) = *(byte *)(param_1 + 0x77) | 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x80;
      uVar8 = (uint)(ushort)((puVar10->pos).x - *(short *)(param_1 + 0x3d));
      uVar7 = (uint)(ushort)((puVar10->pos).y - *(short *)(param_1 + 0x3f));
      if (0x7fff < uVar8) {
        uVar8 = uVar8 - 0x10000;
      }
      if (0x7fff < uVar7) {
        uVar7 = uVar7 - 0x10000;
      }
      uVar5 = calc_angle_quadrant(uVar8,-uVar7);
      uVar5 = uVar5 & 0x7ff;
      uVar8 = *(uint *)(param_1 + 0xc);
      if ((uVar8 & 0x80) != 0) {
        *(ushort *)(param_1 + 0x57) = uVar5;
      }
      *(ushort *)(param_1 + 0x5d) = uVar5;
      if ((uVar8 & 0x8000) != 0) {
        uVar5 = uVar5 + 0x400 & 0x7ff;
      }
      *(ushort *)(param_1 + 0x26) = uVar5;
      *(undefined1 *)(param_1 + 0x2d) = 1;
      *(uint *)(param_1 + 0xc) = uVar8 | 0x40000000;
      goto LAB_004df3ea;
    }
    if (cVar1 == '\x01') {
      sVar6 = 0xf;
      if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
         (sVar6 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
        sVar6 = 2;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
      }
      unit_set_object_upper
                (param_1,unit_type_to_obj_indexes_map[(uint)*(byte *)(param_1 + 0x2b) + sVar6 * 9]);
      bVar3 = true;
      *(undefined2 *)(param_1 + 0x37) = 1;
      *(undefined1 *)(param_1 + 0x39) = 0;
      *(ushort *)(param_1 + 0x70) =
           ((char)obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2 + 1) *
           (ushort)(byte)vstart_related[*(short *)(param_1 + 0x33)].frame_counter;
      if ((*(short *)(param_1 + 0x9f) == 0) || ((*(byte *)(param_1 + 0x13) & 2) == 0)) {
        bVar3 = false;
      }
      if (bVar3) {
        *(short *)(param_1 + 0x5f) = *(short *)(param_1 + 0x5f) / 2;
      }
      else {
        *(undefined2 *)(param_1 + 0x5f) = 0;
      }
      FUN_0051fbf0(param_1,puVar10,0);
      *(undefined1 *)(param_1 + 0x2d) = 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      goto LAB_004df3ea;
    }
    if (cVar1 != '\x02') goto LAB_004df3ea;
    sVar6 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar6;
    if (0 < sVar6) goto LAB_004df3ea;
  }
  bVar4 = true;
LAB_004df3ea:
  if (bVar4) {
    if ((game_state.level_flags & 2) != 0) {
      if (*(byte *)(param_1 + 0x2b) == 7) {
        return 0x27;
      }
      return unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
    }
    uVar9 = unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
  }
  return uVar9;
}
