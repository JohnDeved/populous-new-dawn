/* Ghidra 12.1.3 pseudocode; entry 00403280; unit_processing_class_2_bldg.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_processing_class_2_bldg(int param_1)

{
  ushort uVar1;
  uint uVar2;
  unit_struct *puVar3;
  bool bVar4;
  uint uVar5;
  char cVar6;
  unit_struct *puVar7;

  if ((*(char *)(param_1 + 0x2b) != '\x12') || (((byte)level_flags_1 & 0x40) == 0)) {
    if ((*(uint *)(param_1 + 0xc) & 0x8000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xf7ffffff;
      FUN_00403d50(param_1);
      landscape_move_1(param_1,1);
      if (*(char *)(param_1 + 0x2b) != '\n') {
        landscape_move_2(param_1);
      }
    }
    if ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0) {
      *(byte *)(param_1 + 0x9c) = *(byte *)(param_1 + 0x9c) | 4;
    }
    if (*(char *)(param_1 + 0xab) != '\0') {
      *(char *)(param_1 + 0xab) = *(char *)(param_1 + 0xab) + -1;
    }
    if ((*(uint *)(param_1 + 0xc) & 0x2000000) == 0) {
      if ((*(uint *)(param_1 + 0xc) & 4) != 0) {
        FUN_00408080(param_1);
      }
      uVar2 = *(uint *)(param_1 + 0xc);
      if ((uVar2 & 8) != 0) {
        cVar6 = *(char *)(param_1 + 0xaf);
        *(uint *)(param_1 + 0xc) = uVar2 & 0xfffffff7;
        if (((unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x4a & 1) == 0) &&
           (*(char *)(param_1 + 0x2c) != '\x04')) {
          if ((uVar2 & 0x100000) == 0) {
            empty_unit_function(param_1);
            *(undefined1 *)(param_1 + 0x2c) = 4;
            init_unit_class(param_1);
          }
          if (cVar6 != -1) {
            *(char *)(param_1 + 0xaf) = cVar6;
          }
        }
      }
    }
    if ((*(uint *)(param_1 + 0x14) & 0x40) == 0) {
      if ((*(char *)(param_1 + 0xae) != '\0') &&
         (cVar6 = *(char *)(param_1 + 0xae) + -1, *(char *)(param_1 + 0xae) = cVar6, cVar6 == '\0'))
      {
        *(undefined1 *)(param_1 + 0xad) = 0;
      }
    }
    else if (*(char *)(param_1 + 0xad) == '\0') {
      *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffffbf;
    }
    else if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
      *(char *)(param_1 + 0xad) = *(char *)(param_1 + 0xad) + -1;
    }
    FUN_0051fed0(param_1);
    if ((*(ushort *)(param_1 + 0x9c) & 1) != 0) {
      *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0xfffe;
    }
    if ((*(ushort *)(param_1 + 0x9c) & 2) != 0) {
      cVar6 = *(char *)(param_1 + 0xa7) + -1;
      *(char *)(param_1 + 0xa7) = cVar6;
      if (cVar6 < '\x01') {
        *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x20;
        *(undefined2 *)(param_1 + 0x6c) = 0;
        *(undefined2 *)(param_1 + 0x6e) = 0;
        *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0xfffd;
      }
      else {
        *(ushort *)(param_1 + 0x6e) = (-(ushort)((*(byte *)(param_1 + 0x2e) & 2) == 0) & 0xfffc) + 2
        ;
        *(ushort *)(param_1 + 0x6c) =
             (-(ushort)(((int)(char)*(byte *)(param_1 + 0x2e) + 1U & 2) == 0) & 0xfffc) + 2;
      }
    }
    FUN_00408ed0(param_1);
    if ((*(byte *)(param_1 + 0x9c) & 0x40) != 0) {
      uVar5 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar2 = uVar5 >> 0xd;
      game_state.pseudo_random_val = uVar2 | uVar5 * 0x80000;
      *(short *)(param_1 + 0x9e) = *(short *)(param_1 + 0x9e) + ((ushort)uVar2 & 0x7f) + 0x18;
    }
    FUN_004092a0(param_1);
    FUN_004f0f60(param_1);
    if ((*(byte *)(param_1 + 0xc) & 1) == 0) {
      if ((unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x49 & 8) != 0) {
        puVar7 = (unit_struct *)0x0;
        if (((*(ushort *)(param_1 + 0xa2) != 0) &&
            (puVar3 = unit_land_array[*(ushort *)(param_1 + 0xa2)],
            (*(byte *)&puVar3->flags_2 & 1) == 0)) && (puVar3->unit_class != '\0')) {
          puVar7 = puVar3;
        }
        bVar4 = true;
        while (puVar7 != (unit_struct *)0x0) {
          cVar6 = FUN_00409500(param_1,puVar7);
          if (cVar6 == '\0') {
            bVar4 = false;
          }
          uVar1 = *(ushort *)((int)&puVar7->loc_2_z + 1);
          puVar7 = (unit_struct *)0x0;
          if (((uVar1 != 0) && (puVar3 = unit_land_array[uVar1], (puVar3->flags_2 & 1) == 0)) &&
             (puVar3->unit_class != '\0')) {
            puVar7 = puVar3;
          }
        }
        if (!bVar4) {
          FUN_00409580(param_1);
        }
      }
      switch(*(undefined1 *)(param_1 + 0x2c)) {
      case 2:
        if ((game_state.level_flags & 0x20) == 0) {
          uVar2 = *(uint *)&unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x48;
          if ((uVar2 & 0x20) == 0) {
            if ((uVar2 & 1) == 0) {
              if ((uVar2 & 0x40) != 0) {
                FUN_00406600(param_1);
              }
            }
            else {
              FUN_00405b80(param_1);
            }
          }
          else {
            FUN_004055f0(param_1);
          }
          FUN_004050c0(param_1);
          FUN_00404c80(param_1);
          if ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0) {
            FUN_0040c4e0(param_1);
            return;
          }
        }
        break;
      case 3:
        alloc_spell_blast_or_sinking(param_1);
        return;
      case 4:
        FUN_00408ab0(param_1);
        return;
      case 5:
        FUN_00407060(param_1);
        return;
      case 6:
        FUN_004f1530(param_1,param_1 + 0xa4);
      }
    }
  }
  return;
}
