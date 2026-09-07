/* Ghidra 12.1.3 pseudocode; entry 004092a0; FUN_004092a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004092a0(int param_1)

{
  byte bVar1;
  char cVar2;
  unit_struct *puVar3;
  int iVar4;
  uint uVar5;
  char cVar6;
  int iVar7;
  int iVar8;
  uint uVar9;
  byte bVar10;
  unit_struct *local_c;

  if ((*(byte *)(param_1 + 0x14) & 0x80) == 0) {
    bVar1 = *(byte *)(param_1 + 0x2b);
    if (((*(byte *)(param_1 + 0x2e) & 3) == 0) && (*(short *)(param_1 + 0x9e) != 0)) {
      *(short *)(param_1 + 0x9e) = *(short *)(param_1 + 0x9e) + -1;
    }
    if (*(ushort *)&unit_type_array_building[bVar1].field_0x2e <= *(ushort *)(param_1 + 0x9e)) {
      cVar2 = *(char *)(param_1 + 0x78);
      FUN_00498140(param_1);
      local_c = (unit_struct *)0x0;
      if (((*(ushort *)(param_1 + 0x82) != 0) &&
          (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x82)],
          (*(byte *)&puVar3->flags_2 & 1) == 0)) && (puVar3->unit_class != '\0')) {
        local_c = puVar3;
      }
      if (local_c != (unit_struct *)0x0) {
        if ((unit_type_array_building[bVar1].field_0x4a & 8) != 0) {
          *(undefined2 *)&local_c->field_0x96 = 0;
        }
        cVar6 = FUN_004ba2c0(local_c,0xffffff9c);
        if (cVar6 != '\0') {
          if (2 < cVar2) {
            cVar6 = *(char *)(param_1 + 0xa6);
            while (cVar6 != '\0') {
              remove_person_from_hut(param_1,0);
              cVar6 = *(char *)(param_1 + 0xa6);
            }
          }
          iVar7 = alloc_building_damage_smoke(param_1);
          if (iVar7 != 0) {
            uVar9 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            uVar5 = uVar9 >> 0xd;
            game_state.pseudo_random_val = uVar5 | uVar9 * 0x80000;
            *(ushort *)(iVar7 + 0x6c) = ((ushort)uVar5 & 0xff) + (short)DAT_005aa59c;
          }
          FUN_00407860(param_1,0,1,(int)cVar2,0,1,0xffffffff,0xffffffff,0);
        }
        FUN_004ba590(local_c);
        bVar10 = 0;
        iVar7 = 0x89d1c8;
        FUN_004ba5b0(local_c,*(undefined1 *)(param_1 + 0xaf));
        if (game_state._858439_1_ != '\0') {
          do {
            if (*(char *)(iVar7 + 0xc1f) == '\x01') {
              for (iVar4 = *(int *)(iVar7 + 0x881); iVar4 != 0; iVar4 = *(int *)(iVar4 + 8)) {
                iVar8 = FUN_004f2430(iVar4);
                if ((iVar8 != 0) && (iVar8 = FUN_0040ba20(iVar4,param_1), iVar8 != 0)) {
                  FUN_004f2560(iVar4,1);
                  break;
                }
              }
            }
            bVar10 = bVar10 + 1;
            iVar7 = iVar7 + 0xc65;
          } while (bVar10 < (byte)game_state._858439_1_);
        }
        *(short *)(param_1 + 0x9e) =
             *(short *)(param_1 + 0x9e) - *(short *)&unit_type_array_building[bVar1].field_0x2e;
        if (*(short *)&local_c->field_0x96 < 1) {
          if (local_c != (unit_struct *)0x0) {
            FUN_0040b230(local_c);
            FUN_004ef180(local_c);
          }
          if (param_1 != 0) {
            FUN_0041b550(*(undefined1 *)(param_1 + 0x2f),7,1);
            FUN_004ef180(param_1);
          }
        }
        if ('\0' < *(char *)(param_1 + 0x78)) {
          FUN_0048a050(param_1,0x34,0);
        }
      }
    }
  }
  return;
}
