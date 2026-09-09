/* Ghidra 12.1.3 pseudocode; entry 00439580; FUN_00439580.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00439608) */
/* WARNING: Removing unreachable block (ram,0x00439612) */

undefined4 FUN_00439580(int param_1)

{
  unit_struct *puVar1;
  ushort uVar2;
  undefined4 in_EAX;
  uint uVar3;
  uint uVar4;
  undefined1 uVar5;
  uint uVar6;
  undefined2 local_12;
  short local_8;
  short local_6;
  short local_4;
  short local_2;

  uVar5 = 0;
  uVar2 = *(ushort *)(param_1 + 0x76);
  uVar6 = CONCAT22((short)((uint)in_EAX >> 0x10),uVar2);
  if ((uVar2 & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = uVar2 & 0xffef;
    puVar1 = unit_land_array[*(ushort *)(param_1 + 0x89)];
    if ((unit_type_array_building[(byte)puVar1->field_0x9e].field_0x49 & 2) == 0) {
      uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar6 = uVar6 >> 0xd | uVar6 * 0x80000;
      game_state.pseudo_random_val = uVar6;
    }
    else {
      FUN_004b9fc0(puVar1,&local_4);
      FUN_004ba130(puVar1,&local_8);
      uVar6 = (uint)(ushort)(local_4 - local_8);
      uVar3 = (uint)(ushort)(local_2 - local_6);
      if (0x7fff < uVar6) {
        uVar6 = uVar6 - 0x10000;
      }
      if (0x7fff < uVar3) {
        uVar3 = uVar3 - 0x10000;
      }
      uVar2 = calc_angle_quadrant(uVar6,-uVar3);
      uVar4 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar3 = uVar4 >> 0xd;
      uVar6 = (uVar2 & 0x7ff) + ((uVar3 & 0x3ff) - 0x200);
      game_state.pseudo_random_val = uVar3 | uVar4 * 0x80000;
    }
    FUN_004d4f40(param_1);
    update_gs_unit_related_array_item(param_1);
    *(ushort *)(param_1 + 0x57) = (ushort)uVar6 & 0x7ff;
    uVar6 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar6 | 0x80;
    uVar6 = uVar6 | 0x1080;
    *(uint *)(param_1 + 0xc) = uVar6;
  }
  if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
    local_12 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                        (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    uVar6 = (local_12 & 0xfe) * 2 | local_12 & 0xfe00;
    if (((&game_state.level_data[0].unit_index_2)[uVar6 * 2] & 0x3ff) == 0) {
      uVar5 = 1;
    }
  }
  return CONCAT31((int3)(uVar6 >> 8),uVar5);
}
