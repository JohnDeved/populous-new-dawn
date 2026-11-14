/* Ghidra 12.1.3 pseudocode; entry 0043d6e0; FUN_0043d6e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0043d6e0(char param_1)

{
  unit_struct *puVar1;
  bool bVar2;
  uint uVar3;
  ushort *puVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  uint local_4;

  iVar7 = 0;
  puVar1 = game_state.tribes_array[param_1].person_units;
  do {
    if (puVar1 == (unit_struct *)0x0) {
      return iVar7;
    }
    if (puVar1->state == '\n') {
      uVar3 = (uint)(byte)puVar1->hut_people_inside;
      puVar4 = (ushort *)((int)&puVar1->loc_3_z + uVar3 * 2 + 1);
      if ((*puVar4 != 0) &&
         ((*(char *)((int)(game_state.sunlight_array + 0x32) + (uint)*puVar4 * 10) == '\v' ||
          (*(char *)((int)(game_state.sunlight_array + 0x32) + (uint)*puVar4 * 10) == '\x19')))) {
        bVar2 = false;
        if ((byte)puVar1->hut_people_inside < 8) {
          do {
            if ((((*puVar4 != 0) &&
                 (iVar5 = (uint)*puVar4 * 10,
                 (*(byte *)((int)(game_state.sunlight_array + 0x32) + iVar5 + 1) & 1) == 0)) &&
                (*(char *)((int)(game_state.sunlight_array + 0x32) + iVar5) != '\v')) &&
               (*(char *)((int)(game_state.sunlight_array + 0x32) + iVar5) != '\x19')) {
              bVar2 = true;
              local_4 = uVar3;
              break;
            }
            puVar4 = puVar4 + 1;
            uVar3 = uVar3 + 1;
          } while ((int)uVar3 < 8);
        }
        if (bVar2) {
          iVar5 = 0;
          if (0 < (int)local_4) {
            do {
              iVar6 = iVar5 + 1;
              FUN_004364d0(puVar1,iVar5);
              iVar5 = iVar6;
            } while (iVar6 < (int)local_4);
          }
          puVar1->hut_people_inside = (char)local_4;
          iVar7 = iVar7 + 1;
          FUN_00432df0(puVar1);
          FUN_004d4f40(puVar1);
        }
      }
    }
    puVar1 = puVar1->next_unit;
  } while( true );
}
