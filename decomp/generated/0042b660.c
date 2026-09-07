/* Ghidra 12.1.3 pseudocode; entry 0042b660; clear_tribe.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void clear_tribe(char param_1)

{
  undefined1 *puVar1;
  int iVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  undefined4 *puVar6;

  iVar4 = (int)param_1;
  iVar2 = iVar4 * 0xc65 + 0x89d1c8;
  game_state.tribes_array[iVar4].field_0xc1f = 2;
  if (((byte)land_flags_1 & 8) == 0) {
    if (player_tribe_num == param_1) {
      puVar6 = &game_state.tribes_array[iVar4].array_0x164;
      for (iVar5 = 0x164; iVar5 != 0; iVar5 = iVar5 + -1) {
        *puVar6 = 0;
        puVar6 = puVar6 + 1;
      }
      *(undefined2 *)puVar6 = 0;
      *(undefined1 *)((int)puVar6 + 2) = 0;
    }
    else {
      game_state.tribes_array[iVar4].field_0xc1f = 1;
      FUN_00461d70(iVar2);
    }
  }
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0x917 = 0;
  *(undefined2 *)&game_state.tribes_array[iVar4].field_0x91b = 0;
  game_state.tribes_array[iVar4].field1414_0x969[0x29] = 0;
  game_state.tribes_array[iVar4].field1414_0x969[0x2a] = 0;
  game_state.tribes_array[iVar4].field1414_0x969[0x2b] = 0;
  game_state.tribes_array[iVar4].field1414_0x969[0x2c] = 0;
  game_state.tribes_array[iVar4].field_0xc20 = 1;
  game_state.tribes_array[iVar4].f_949 = 0;
  game_state.tribes_array[iVar4].num_persons = 0;
  game_state.tribes_array[iVar4].buildings_num = 0;
  game_state.tribes_array[iVar4].building_units = (unit_struct *)0x0;
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0x945 = 0;
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0x94d = 0;
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0x951 = 0;
  game_state.tribes_array[iVar4].mana = 0;
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0x959 = 0;
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0x95d = 0;
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0x94d = 0;
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0xc26 = 0;
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0xc2a = 0;
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0xc2e = 0;
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0xc32 = 0;
  *(undefined4 *)&game_state.tribes_array[iVar4].field_0xc36 = 0;
  *(undefined2 *)&game_state.tribes_array[iVar4].field_0xc3a = 0;
  *(undefined4 *)((int)game_state.tribes_array[iVar4].field1414_0x969 + 0xb6) = 0;
  *(undefined4 *)((int)game_state.tribes_array[iVar4].field1414_0x969 + 0xba) = 0;
  puVar6 = game_state.tribes_array[iVar4].field1414_0x969;
  for (iVar5 = 0x20; iVar5 != 0; iVar5 = iVar5 + -1) {
    *puVar6 = 0;
    puVar6 = puVar6 + 1;
  }
  add_mana(iVar2,start_mana,0);
  puVar1 = &game_state.tribes_array[iVar4].field_0x93d;
  if (game_state.tribes_array[iVar4].field_0xc1f == '\x01') {
    *(uint *)puVar1 = *(uint *)puVar1 | 0x20;
  }
  else {
    *(uint *)puVar1 = *(uint *)puVar1 & 0xffffffdf;
  }
  uVar3 = *(uint *)puVar1;
  *(uint *)puVar1 = uVar3 & 0xfffdffff;
  *(uint *)puVar1 = uVar3 & 0xfff9ffff;
  uVar3 = *(uint *)&game_state.tribes_array[iVar4].field_0x941;
  *(uint *)&game_state.tribes_array[iVar4].field_0x941 = uVar3 & 0xfffffffd;
  *(uint *)&game_state.tribes_array[iVar4].field_0x941 = uVar3 & 0xfffffff9;
  *(uint *)&game_state.tribes_array[iVar4].field_0x941 = uVar3 & 0xfffffff1;
  *(uint *)&game_state.tribes_array[iVar4].field_0x941 = uVar3 & 0xffffffe1;
  *(uint *)&game_state.tribes_array[iVar4].field_0x941 = uVar3 & 0xffffffc1;
  *(uint *)&game_state.tribes_array[iVar4].field_0x941 = uVar3 & 0xffffffc0;
  *(uint *)&game_state.tribes_array[iVar4].field_0x941 = uVar3 & 0xffffff40;
  if ((load_level_flags._1_1_ & 2) == 0) {
    uVar3 = *(uint *)puVar1;
    *(uint *)puVar1 = uVar3 & 0xfffffffe;
    *(uint *)puVar1 = uVar3 & 0xfffffffc;
  }
  puVar1 = &game_state.tribes_array[iVar4].field_0x941;
  *(uint *)puVar1 = *(uint *)puVar1 & 0xffffffbf;
  return;
}
