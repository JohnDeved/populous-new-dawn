/* Ghidra 12.1.3 pseudocode; entry 00451720; FUN_00451720.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_00451720(int param_1,uint param_2,int param_3,undefined4 *param_4)

{
  undefined4 uVar1;
  char cVar2;
  unit_struct *puVar3;
  int iVar4;
  int iVar5;
  unit_struct *local_1c;
  short local_14;
  short local_12;
  int local_10;
  undefined4 local_c;
  undefined2 local_8;
  uint local_4;

  local_1c = (unit_struct *)0x0;
  if (param_3 != 0) {
    puVar3 = (unit_struct *)FUN_004518c0(param_1,param_2,param_3,param_4,0,0);
    return puVar3;
  }
  local_4 = (uint)((*(uint *)&game_state.tribes_array[param_1].field_0x93d & 0x80) == 0);
  local_10 = fast_sqrt(0x2400000);
  uVar1 = *param_4;
  local_8 = *(undefined2 *)(param_4 + 1);
  local_c._0_2_ = (ushort)uVar1;
  iVar5 = 0;
  local_14 = ((ushort)local_c & 0xfe00) + 0x100;
  local_c._2_2_ = (ushort)((uint)uVar1 >> 0x10);
  local_12 = (local_c._2_2_ & 0xfe00) + 0x100;
  local_c = uVar1;
  while( true ) {
    for (puVar3 = game_state.tribes_array[param_1].person_units; puVar3 != (unit_struct *)0x0;
        puVar3 = puVar3->next_unit) {
      cVar2 = FUN_004e3430(puVar3,0);
      if ((((cVar2 != '\0') && (puVar3->unit_type != 7)) &&
          ((param_2 == 0 || ((byte)puVar3->unit_type == param_2)))) &&
         ((((puVar3->obj_index_anim_prev_2 & 0x7000U) >> 0xc == (ushort)(byte)(&DAT_0059cd94)[iVar5]
           && (FUN_004513e0(puVar3), (*(byte *)&puVar3->loc_1_x & 0x80) == 0)) &&
          (iVar4 = calc_distance_toroidal(&local_14,&puVar3->pos), iVar4 < local_10)))) {
        local_1c = puVar3;
        local_10 = iVar4;
      }
    }
    if (local_1c != (unit_struct *)0x0) break;
    iVar5 = iVar5 + 1;
    if (6 < iVar5) {
      if (local_4 == 0) {
        return (unit_struct *)0x0;
      }
      puVar3 = (unit_struct *)FUN_004518c0(param_1,param_2,0,param_4,0,0);
      return puVar3;
    }
  }
  return local_1c;
}
