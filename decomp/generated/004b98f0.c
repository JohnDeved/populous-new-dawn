/* Ghidra 12.1.3 pseudocode; entry 004b98f0; FUN_004b98f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004b98f0(uint param_1,undefined4 param_2,char param_3)

{
  unit_struct *puVar1;
  undefined4 uVar2;
  bool bVar3;
  byte bVar4;
  char cVar5;
  byte bStack_d;
  short local_8;
  short sStack_6;
  undefined2 local_4;

  bVar4 = (byte)(param_1 >> 8);
  local_8 = ((ushort)param_1 & 0xfe) << 8;
  bStack_d = bVar4 & 0xfe;
  uVar2 = CONCAT22(sStack_6,local_8);
  sStack_6 = (ushort)bStack_d << 8;
  local_4 = calc_point_height(uVar2,(uint)(CONCAT21(local_4,bVar4) & 0xfffffe) << 8);
  cVar5 = FUN_00518200(&local_8,0);
  if ((cVar5 == '\0') &&
     (((&game_state.level_data[0].unit_index_2)[((param_1 & 0xfe) * 2 | param_1 & 0xfe00) * 2] &
      0x3ff) == 0)) {
    puVar1 = unit_land_array
             [(short)(&game_state.level_data[0].unit_index)
                     [((param_1 & 0xfe) * 2 | param_1 & 0xfe00) * 2]];
    bVar3 = true;
    while ((puVar1 != (unit_struct *)0x0 && (bVar3))) {
      if (PTR_008922d8 != puVar1) {
        if (puVar1->unit_class == '\x05') {
          if (puVar1->unit_type != '\x11') goto LAB_004b99f9;
        }
        else if (((puVar1->unit_class == '\n') && (param_3 == '\0')) &&
                (puVar1->unit_type == '\x10')) {
LAB_004b99f9:
          bVar3 = false;
        }
      }
      puVar1 = unit_land_array[puVar1->next_unit_index];
    }
  }
  return;
}
