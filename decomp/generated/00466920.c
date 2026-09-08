/* Ghidra 12.1.3 pseudocode; entry 00466920; FUN_00466920.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_00466920(int param_1,undefined4 param_2,int param_3,int param_4)

{
  unit_struct *puVar1;
  bool bVar2;
  char cVar3;
  int iVar4;
  int iVar5;
  unit_struct *local_4;

  local_4 = (unit_struct *)0x0;
  param_4 = param_4 * param_4;
  for (puVar1 = airship_units; puVar1 != (unit_struct *)0x0; puVar1 = puVar1->next_unit) {
    iVar4 = calc_squared_distance_toroidal(param_2,&puVar1->pos);
    if ((param_3 * param_3 <= iVar4) && (iVar4 < param_4)) {
      bVar2 = false;
      if ((((puVar1->facs0_index & 1) == 0) &&
          (((char)puVar1->field_0x9e <
            (char)unit_type_array_vehicle[(byte)puVar1->unit_type].field_0x8 &&
           (cVar3 = FUN_00465650(puVar1), cVar3 != '\0')))) &&
         ((puVar1->field_0x9e == '\0' ||
          (unit_land_array[(ushort)puVar1->loc_1_x]->tribe_index == *(char *)(param_1 + 0x2f))))) {
        bVar2 = true;
      }
      if ((bVar2) &&
         ((game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f != '\x01' ||
          (iVar5 = FUN_004f2490(puVar1), iVar5 == 0)))) {
        param_4 = iVar4;
        local_4 = puVar1;
      }
    }
  }
  return local_4;
}
