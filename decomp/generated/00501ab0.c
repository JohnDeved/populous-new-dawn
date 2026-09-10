/* Ghidra 12.1.3 pseudocode; entry 00501ab0; find_formation_for_unit.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 find_formation_for_unit(int param_1,undefined4 *param_2)

{
  char cVar1;
  char cVar2;
  byte bVar3;
  undefined2 uVar4;
  unit_struct *puVar5;
  undefined2 uVar6;
  short sVar7;
  uint uVar8;
  int iVar9;
  uint uVar10;
  undefined4 local_8;
  int local_4;

  cVar1 = *(char *)(param_1 + 0x2f);
  cVar2 = *(char *)(param_1 + 0x2b);
  local_4 = calc_squared_distance_toroidal(param_1 + 0x53,param_1 + 0x3d);
  puVar5 = game_state.tribes_array[cVar1].formation_units;
  do {
    if (puVar5 == (unit_struct *)0x0) {
      return 0;
    }
    if (((puVar5->unit_class != '\0') && (puVar5->state_2 == cVar2)) &&
       (uVar8 = (int)(short)(puVar5->pos).x - (int)*(short *)(param_1 + 0x3d),
       uVar10 = (int)uVar8 >> 0x1f, (int)((uVar8 ^ uVar10) - uVar10) < 0x838)) {
      uVar8 = (int)(short)(puVar5->pos).y - (int)*(short *)(param_1 + 0x3f);
      uVar10 = (int)uVar8 >> 0x1f;
      iVar9 = (uVar8 ^ uVar10) - uVar10;
      if (((iVar9 < 0x838) &&
          (sVar7 = calc_angular_diff_shortest
                             (CONCAT22(*(short *)(param_1 + 0x3f) >> 0xf,
                                       *(undefined2 *)(param_1 + 0x5d)),
                              CONCAT22((short)((uint)iVar9 >> 0x10),
                                       *(undefined2 *)&puVar5->field_0x5d)), sVar7 < 0x71)) &&
         (bVar3 = *(byte *)((int)&puVar5->coord_scale_4 + 1), bVar3 < 0xb)) {
        uVar4 = (puVar5->pos).x;
        uVar6 = (puVar5->pos).y;
        local_8 = CONCAT22(uVar6 + *(char *)((int)&puVar5->loc_2_y + (uint)bVar3 * 2 + 1) * 0x10,
                           uVar4 + *(char *)(&puVar5->loc_2_y + bVar3) * 0x10);
        iVar9 = calc_squared_distance_toroidal(&puVar5->pos_x1,&local_8);
        if (iVar9 - local_4 < 0x41) {
          *param_2 = puVar5;
          return 1;
        }
      }
    }
    puVar5 = puVar5->next_unit;
  } while( true );
}
