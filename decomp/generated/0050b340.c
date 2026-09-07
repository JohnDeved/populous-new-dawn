/* Ghidra 12.1.3 pseudocode; entry 0050b340; FUN_0050b340.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0050b4c6) */
/* WARNING: Removing unreachable block (ram,0x0050b4d0) */

void FUN_0050b340(int param_1)

{
  undefined2 *puVar1;
  unit_struct *puVar2;
  int iVar3;
  bool bVar4;
  int iVar5;
  char cVar6;
  ushort uVar7;
  uint uVar8;
  int iVar9;
  uint uVar10;
  bool bVar11;
  bool local_f;
  ushort local_e;
  int local_8;

  iVar5 = DAT_005aa5b8;
  bVar11 = false;
  local_8 = 0;
  local_e = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
  for (puVar2 = unit_land_array
                [(short)(&game_state.level_data[0].unit_index)
                        [((local_e & 0xfe) * 2 | local_e & 0xfe00) * 2]];
      puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
    if ((*(byte *)((int)&puVar2->flags_4 + 1) & 1) != 0) {
      bVar4 = true;
      local_f = false;
      if (puVar2->unit_class == '\x01') {
        cVar6 = FUN_00416d70(puVar2,param_1);
        bVar11 = cVar6 != '\0';
        if ((*(char *)(param_1 + 0x7b) == '\0') && (bVar11)) {
          bVar4 = false;
        }
        if ((puVar2->unit_type == '\a') && (puVar2->tribe_index == *(char *)(param_1 + 0x2f))) {
          bVar4 = false;
        }
        if (puVar2->unit_type == '\b') {
          bVar4 = false;
        }
        if (puVar2->unit_land_array_index != 0) {
          bVar4 = false;
        }
        local_f = (*(byte *)((int)&puVar2->flags_3 + 2) & 2) != 0;
        if (local_f) {
          bVar4 = false;
        }
        local_f = !local_f;
        if (bVar11) {
          if (local_8 < iVar5) {
            local_8 = local_8 + 1;
          }
          else {
            bVar4 = false;
            local_f = false;
          }
        }
      }
      if ((*(byte *)((int)&puVar2->flags_3 + 1) & 0x80) != 0) {
        bVar4 = false;
        local_f = false;
      }
      if (bVar4) {
        if ((((*(byte *)(param_1 + 0x7a) & 1) != 0) && (puVar2->unit_class == '\x01')) &&
           (puVar2->state != '\x1a')) {
          if ((*(byte *)((int)&puVar2->flags_2 + 2) & 0x10) == 0) {
            *(undefined1 *)((int)&puVar2->loc_1_y + 1) = puVar2->state;
            empty_unit_function(puVar2);
            puVar2->state = 0x1a;
            init_unit_class(puVar2);
          }
          puVar2->field_0xa4 = 0x18;
        }
        uVar10 = puVar2->flags_2;
        puVar2->flags_2 = uVar10 | 0x2000;
        puVar2->flags_2 = uVar10 | 0x82000;
        if (*(char *)(param_1 + 0x7c) == '\0') {
          puVar2->flags_3 = puVar2->flags_3 | 8;
        }
        uVar10 = (uint)(ushort)(*(short *)(param_1 + 0x3d) - (puVar2->pos).x);
        uVar8 = (uint)(ushort)(*(short *)(param_1 + 0x3f) - (puVar2->pos).y);
        if (0x7fff < uVar10) {
          uVar10 = uVar10 - 0x10000;
        }
        if (0x7fff < uVar8) {
          uVar8 = uVar8 - 0x10000;
        }
        uVar7 = calc_angle_quadrant(uVar10,-uVar8);
        iVar9 = calc_distance_toroidal(&puVar2->pos,param_1 + 0x3d);
        if (iVar9 < 0) {
          iVar9 = 0;
        }
        iVar3 = *(int *)(param_1 + 0x6c);
        if (iVar3 < iVar9) {
          iVar9 = iVar3;
        }
        FUN_004e93f0(&puVar2->vec2,&puVar2->pos,
                     ((iVar3 - iVar9) * (int)*(short *)(param_1 + 0x74)) / iVar3,
                     (uVar7 & 0x7ff) + 0x400 & 0x7ff);
        puVar1 = &(puVar2->vec2).y;
        *puVar1 = *puVar1 + (short)(((*(int *)(param_1 + 0x6c) - iVar9) *
                                    (int)*(short *)(param_1 + 0x78)) / *(int *)(param_1 + 0x6c));
        if ((puVar2->unit_class == '\x01') && (puVar2->state == '\x1a')) {
          puVar2->flags_4 = puVar2->flags_4 | 0x2000;
        }
      }
      if ((local_f) && (FUN_004d3ea0(puVar2), !bVar11)) {
        if ((*(char *)(param_1 + 0x7d) != '\0') && (puVar2->tribe_index != -1)) {
          uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar10 = uVar8 >> 0xd;
          game_state.pseudo_random_val = uVar10 | uVar8 * 0x80000;
          puVar2->field_0xa4 = ((byte)uVar10 & 0xf) + 0x10;
        }
        FUN_004da080(puVar2,*(undefined1 *)(param_1 + 0x2f),DAT_005aa510,0);
        if ((*(byte *)((int)&puVar2->flags_4 + 1) & 8) != 0) {
          FUN_004ef180(puVar2);
        }
      }
    }
  }
  update_after_unit_alloc(param_1);
  return;
}
