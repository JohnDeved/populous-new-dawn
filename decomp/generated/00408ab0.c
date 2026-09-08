/* Ghidra 12.1.3 pseudocode; entry 00408ab0; FUN_00408ab0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00408ab0(int param_1)

{
  unit_struct *puVar1;
  uint uVar2;
  char cVar3;
  uint uVar4;
  int iVar5;
  unit_struct *puVar6;
  ushort *puVar7;

  cVar3 = *(char *)(param_1 + 0xa7) + -1;
  *(char *)(param_1 + 0xa7) = cVar3;
  if (cVar3 < '\x01') {
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 1;
      init_unit_class(param_1);
    }
  }
  else {
    if ((cVar3 == 'w') && (*(char *)(param_1 + 0xa6) != '\0')) {
      puVar7 = (ushort *)(param_1 + 0x86);
      iVar5 = 6;
      do {
        puVar6 = (unit_struct *)0x0;
        if (((*puVar7 != 0) &&
            (puVar1 = unit_land_array[*puVar7], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
           (puVar1->unit_class != '\0')) {
          puVar6 = puVar1;
        }
        if (puVar6 != (unit_struct *)0x0) {
          remove_person_from_hut(param_1,puVar6);
          puVar6->flags_2 = puVar6->flags_2 & 0xffffffef;
          puVar6->field_0xa4 = 0x18;
          if ((*(byte *)((int)&puVar6->flags_2 + 2) & 0x10) == 0) {
            *(undefined1 *)((int)&puVar6->loc_1_y + 1) = puVar6->state;
            empty_unit_function(puVar6);
            puVar6->state = 0x1a;
            init_unit_class(puVar6);
          }
        }
        puVar7 = puVar7 + 1;
        iVar5 = iVar5 + -1;
      } while (iVar5 != 0);
    }
    if (*(char *)(param_1 + 0xa7) < 'P') {
      if (*(char *)(param_1 + 0xa7) == 'O') {
        puVar6 = (unit_struct *)0x0;
        FUN_0048a770(0x53,param_1);
        FUN_00498140(param_1);
        if (((*(ushort *)(param_1 + 0x82) != 0) &&
            (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x82)],
            (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
          puVar6 = puVar1;
        }
        if (puVar6 != (unit_struct *)0x0) {
          cVar3 = FUN_004ba2c0(puVar6,0xffffff9c);
          if (cVar3 != '\0') {
            iVar5 = alloc_building_damage_smoke(param_1);
            if (iVar5 != 0) {
              uVar4 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
              uVar2 = uVar4 >> 0xd;
              game_state.pseudo_random_val = uVar2 | uVar4 * 0x80000;
              *(ushort *)(iVar5 + 0x6c) = ((ushort)uVar2 & 0xff) + (short)DAT_005aa59c;
            }
          }
          FUN_004ba590(puVar6);
          FUN_004ba5b0(puVar6,*(undefined1 *)(param_1 + 0xaf));
          if (*(short *)&puVar6->field_0x96 < 1) {
            if (puVar6 != (unit_struct *)0x0) {
              FUN_0040b230(puVar6);
              FUN_004ef180(puVar6);
            }
            if (param_1 != 0) {
              FUN_0041b550(*(undefined1 *)(param_1 + 0x2f),7,1);
              FUN_004ef180(param_1);
              return;
            }
          }
        }
      }
    }
    else if ((*(byte *)(param_1 + 0x10) & 0x10) == 0) {
      FUN_0048a050(param_1,0x53,0x40);
      return;
    }
  }
  return;
}
