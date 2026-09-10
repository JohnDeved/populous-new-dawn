/* Ghidra 12.1.3 pseudocode; entry 004de810; FUN_004de810.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004de810(char param_1,char param_2,undefined4 param_3)

{
  unit_struct *puVar1;
  unit_struct *puVar2;
  byte bVar3;
  char cVar4;
  uint uVar5;
  int iVar6;
  unit_struct *puVar7;
  unit_struct *puVar8;
  ushort uStack_e;
  short sStack_c;
  short sStack_a;

  uVar5 = (uint)param_1;
  sStack_c = (short)param_2;
  sStack_a = (short)(param_2 >> 7);
  puVar1 = (unit_struct *)((int)&DAT_00899ed3 + ((int)param_2 + uVar5 * 6) * 2);
  uStack_e = *(ushort *)&puVar1->prev_unit;
  puVar7 = puVar1;
  if (uStack_e != 0) {
    puVar2 = unit_land_array[uStack_e];
    puVar7 = (unit_struct *)0x0;
    if (((*(byte *)&puVar2->flags_2 & 1) == 0) && (puVar2->unit_class != '\0')) {
      puVar7 = puVar2;
    }
    if ((((puVar7 != (unit_struct *)0x0) && (puVar7->tribe_index == player_tribe_num)) &&
        (puVar7->unit_class == '\x01')) && ((param_1 == '\0' || ((byte)puVar7->unit_type == uVar5)))
       ) {
      if (param_2 == '\x01') {
        bVar3 = *(byte *)&puVar7->loc_1_x >> 7;
      }
      else {
        if (param_2 != '\0') {
          iVar6 = FUN_004513e0(puVar7);
          bVar3 = 0;
          if (iVar6 != CONCAT22(sStack_a,sStack_c)) goto LAB_004de8c8;
        }
        bVar3 = 1;
      }
LAB_004de8c8:
      if (((bVar3 != 0) &&
          (cVar4 = FUN_00451ac0(puVar7,player_tribe_num * 0xc65 + 0x89d1ec,
                                *(uint *)&game_state.tribes_array[player_tribe_num].field_0x93d &
                                0x80), cVar4 != '\0')) &&
         (((*(byte *)((int)&puVar7->flags_4 + 1) & 8) == 0 || ((char)param_3 != '\0'))))
      goto LAB_004de91f;
    }
  }
  uStack_e = 0;
LAB_004de91f:
  iVar6 = (int)player_tribe_num;
  if (uStack_e == 0) {
    iVar6 = FUN_004518c0(iVar6,uVar5,CONCAT22(sStack_a,sStack_c),iVar6 * 0xc65 + 0x89d1ec,param_3,1)
    ;
    if (iVar6 != 0) {
      uStack_e = *(ushort *)(iVar6 + 0x24);
    }
  }
  else {
    for (puVar2 = game_state.tribes_array[iVar6].person_units;
        (puVar2 != (unit_struct *)0x0 && (puVar2 != puVar7)); puVar2 = puVar2->next_unit) {
    }
    puVar2 = puVar2->next_unit;
    puVar8 = (unit_struct *)0x0;
    while ((puVar2 != (unit_struct *)0x0 && (puVar8 == (unit_struct *)0x0))) {
      if (((param_1 == '\0') || ((byte)puVar2->unit_type == uVar5)) &&
         (((*(byte *)((int)&puVar2->flags_4 + 1) & 8) == 0 || ((char)param_3 != '\0')))) {
        if (param_2 == '\x01') {
          bVar3 = *(byte *)&puVar2->loc_1_x >> 7;
        }
        else {
          if (param_2 != '\0') {
            iVar6 = FUN_004513e0(puVar2);
            bVar3 = 0;
            if (iVar6 != CONCAT22(sStack_a,sStack_c)) goto LAB_004de9b0;
          }
          bVar3 = 1;
        }
LAB_004de9b0:
        if ((bVar3 != 0) &&
           (cVar4 = FUN_00451ac0(puVar2,player_tribe_num * 0xc65 + 0x89d1ec,
                                 *(uint *)&game_state.tribes_array[player_tribe_num].field_0x93d &
                                 0x80), cVar4 != '\0')) {
          puVar8 = puVar2;
        }
      }
      puVar2 = puVar2->next_unit;
    }
    for (puVar2 = game_state.tribes_array[player_tribe_num].person_units;
        (puVar2 != (unit_struct *)0x0 && (puVar2 != puVar7)); puVar2 = puVar2->next_unit) {
      if (puVar8 != (unit_struct *)0x0) goto LAB_004deabf;
      if (((param_1 == '\0') || ((byte)puVar2->unit_type == uVar5)) &&
         (((*(byte *)((int)&puVar2->flags_4 + 1) & 8) == 0 || ((char)param_3 != '\0')))) {
        if (param_2 == '\x01') {
          bVar3 = *(byte *)&puVar2->loc_1_x >> 7;
        }
        else {
          if (param_2 != '\0') {
            iVar6 = FUN_004513e0(puVar2);
            bVar3 = 0;
            if (iVar6 != CONCAT22(sStack_a,sStack_c)) goto LAB_004dea72;
          }
          bVar3 = 1;
        }
LAB_004dea72:
        if ((bVar3 != 0) &&
           (cVar4 = FUN_00451ac0(puVar2,player_tribe_num * 0xc65 + 0x89d1ec,
                                 *(uint *)&game_state.tribes_array[player_tribe_num].field_0x93d &
                                 0x80), cVar4 != '\0')) {
          puVar8 = puVar2;
        }
      }
    }
    if (puVar8 != (unit_struct *)0x0) {
LAB_004deabf:
      uStack_e = puVar8->unit_index;
    }
  }
  *(ushort *)&puVar1->prev_unit = uStack_e;
  if (uStack_e != 0) {
    puVar1 = unit_land_array[(short)uStack_e];
    FUN_00417ca0(&puVar1->pos,0xffffffff,0);
    FUN_00504590(puVar1,0);
  }
  return;
}
