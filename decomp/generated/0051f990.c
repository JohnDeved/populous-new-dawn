/* Ghidra 12.1.3 pseudocode; entry 0051f990; FUN_0051f990.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0051face) */
/* WARNING: Removing unreachable block (ram,0x0051fad8) */

undefined1 FUN_0051f990(int param_1,int param_2,char param_3)

{
  short *psVar1;
  ushort uVar2;
  short sVar3;
  int iVar4;
  uint uVar5;
  uint uVar6;
  short sVar7;
  undefined4 uVar8;
  int iVar9;
  undefined4 uVar10;
  undefined1 local_19;
  int local_18;
  undefined4 local_14;
  undefined4 local_10;
  short local_c;
  short local_8;
  short local_6;
  short local_4;

  local_19 = 0;
  if ((game_state.level_flags & 2) == 0) {
    iVar4 = (int)(short)((int)((int)*(short *)(param_1 + 0x41) +
                              ((int)*(short *)(param_1 + 0x41) >> 0x1f & 0x7fU)) >> 7);
    if (iVar4 < 0) {
      iVar4 = 0;
    }
    if (7 < iVar4) {
      iVar4 = 7;
    }
    uVar5 = (int)((&DAT_005aa558)[iVar4] * (uint)(byte)unit_type_array_person[6]._24_1_ +
                 ((int)((&DAT_005aa558)[iVar4] * (uint)(byte)unit_type_array_person[6]._24_1_) >>
                  0x1f & 0xffU)) >> 8;
    iVar4 = get_adjacent_unit(param_1,4);
    if (iVar4 != 0) {
      uVar5 = uVar5 + 4;
    }
    uVar5 = uVar5 | 1;
  }
  else {
    uVar5 = 0x13;
  }
  if (param_3 != '\0') {
    uVar5 = uVar5 + 2;
  }
  if ((*(byte *)(param_1 + 0x12) & 8) == 0) {
    if (*(char *)(param_2 + 0x2a) == '\t') {
      FUN_004ba130(param_2,&local_14);
    }
    else if (*(char *)(param_2 + 0x2a) == '\x02') {
      get_building_coords(param_2,&local_14);
    }
    else {
      local_14 = *(undefined4 *)(param_2 + 0x3d);
    }
  }
  else {
    local_14 = *(undefined4 *)(param_1 + 0x4f);
  }
  psVar1 = (short *)(param_1 + 0x3d);
  iVar4 = (int)(uVar5 * 0x200) / 2 + 0x38;
  uVar5 = (int)(short)local_14 - (int)*psVar1 >> 0x1f;
  if (((int)(((int)(short)local_14 - (int)*psVar1 ^ uVar5) - uVar5) < iVar4) &&
     (uVar5 = (int)local_14._2_2_ - (int)*(short *)(param_1 + 0x3f), uVar6 = (int)uVar5 >> 0x1f,
     (int)((uVar5 ^ uVar6) - uVar6) < iVar4)) {
    local_10 = calc_distance_toroidal(psVar1,(short *)(param_2 + 0x3d));
    uVar5 = (uint)(ushort)(*(short *)(param_2 + 0x3d) - *psVar1);
    uVar6 = (uint)(ushort)(*(short *)(param_2 + 0x3f) - *(short *)(param_1 + 0x3f));
    if (0x7fff < uVar5) {
      uVar5 = uVar5 - 0x10000;
    }
    if (0x7fff < uVar6) {
      uVar6 = uVar6 - 0x10000;
    }
    uVar2 = calc_angle_quadrant(uVar5,-uVar6);
    local_18 = local_10 / 0x180;
    if (local_18 < 1) {
      local_18 = 1;
    }
    if (0x10 < local_18) {
      local_18 = 0x10;
    }
    iVar4 = local_10 / local_18;
    local_10 = *(int *)psVar1;
    local_c = *(short *)(param_1 + 0x41);
    iVar9 = 0;
    local_8 = 0;
    local_6 = 0;
    local_4 = (short)(((int)*(short *)(param_2 + 0x41) - (int)*(short *)(param_1 + 0x41)) / local_18
                     );
    move_pos_angle_length(&local_8,uVar2 & 0x7ff,iVar4);
    uVar10 = CONCAT22((short)((uint)param_1 >> 0x10),local_10._2_2_);
    uVar8 = CONCAT22((short)((uint)iVar4 >> 0x10),(undefined2)local_10);
    local_19 = 1;
    sVar7 = local_c;
    if (0 < local_18) {
      do {
        uVar8 = CONCAT22((short)((uint)uVar8 >> 0x10),(short)uVar8 + local_8);
        sVar7 = sVar7 + local_4;
        uVar10 = CONCAT22((short)((uint)uVar10 >> 0x10),(short)uVar10 + local_6);
        sVar3 = calc_point_height(uVar8,uVar10);
        if (sVar7 + 0x8c < (int)sVar3) {
          return 0;
        }
        iVar9 = iVar9 + 1;
      } while (iVar9 < local_18);
    }
  }
  return local_19;
}
