/* Ghidra 12.1.3 pseudocode; entry 00504590; FUN_00504590.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00504590(unit_struct *param_1,char param_2)

{
  unit_struct *puVar1;
  char cVar2;
  ushort uVar3;
  int iVar4;
  unit_struct *puVar5;
  short local_4;
  undefined2 local_2;

  if ((param_1->unit_class == '\x02') && (param_1->state == '\x01')) {
    param_1 = unit_land_array[(short)param_1->loc_2_y];
  }
  if (((param_2 == '\0') && (param_1->unit_class == '\x01')) &&
     ((*(byte *)((int)&param_1->flags_2 + 2) & 0x80) != 0)) {
    local_2 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),(char)((ushort)(param_1->pos).x >> 8));
    puVar5 = (unit_struct *)0x0;
    uVar3 = (&game_state.level_data[0].unit_index_2)[((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2]
            & 0x3ff;
    if (((uVar3 != 0) && (puVar1 = unit_land_array[uVar3], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
       (puVar1->unit_class != '\0')) {
      puVar5 = puVar1;
    }
    if (puVar5 != (unit_struct *)0x0) {
      param_1 = puVar5;
    }
  }
  cVar2 = FUN_00504060(param_1,&local_4);
  if (cVar2 != '\0') {
    iVar4 = (int)local_4;
    (&DAT_00895fba)[iVar4 * 0x9e] = 1;
    (&DAT_00895fbf)[iVar4 * 0x4f] = (&DAT_00895fd5)[iVar4 * 0x4f];
  }
  return;
}
