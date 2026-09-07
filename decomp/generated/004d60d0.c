/* Ghidra 12.1.3 pseudocode; entry 004d60d0; FUN_004d60d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004d60d0(int param_1)

{
  undefined2 *puVar1;
  short *psVar2;
  uint uVar3;
  byte bVar4;
  char cVar5;
  ushort uVar6;
  uint uVar7;
  uint uVar8;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 extraout_var_01;
  undefined2 extraout_var_02;
  undefined2 uVar9;
  bool bVar10;
  undefined1 local_4 [4];

  bVar10 = true;
  uVar9 = (undefined2)(pseudo_random * 9 >> 0x10);
  uVar7 = pseudo_random * 0x24a1 + 0x24df;
  uVar8 = uVar7 >> 0xd;
  uVar7 = uVar8 | uVar7 * 0x80000;
  pseudo_random = uVar7;
  if ((char)uVar8 == '\0') {
    uVar7 = FUN_0048a050(param_1,0x16,0);
    uVar9 = extraout_var_00;
  }
  uVar8 = uVar7 & 0xffffff00;
  if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
    if (*(char *)(param_1 + 0x7b) != '\0') {
      *(char *)(param_1 + 0x7b) = *(char *)(param_1 + 0x7b) + -1;
    }
    if (*(char *)(param_1 + 0x7c) != '\0') {
      *(char *)(param_1 + 0x7c) = *(char *)(param_1 + 0x7c) + -1;
    }
  }
  if ((*(char *)(param_1 + 0x7b) == '\0') || (*(char *)(param_1 + 0x7c) == '\0')) {
    uVar8 = CONCAT31((int3)(uVar7 >> 8),1);
  }
  if (((char)uVar8 != '\0') && ((*(byte *)(param_1 + 0x2e) & 0xf) == 0)) {
    if ((*(char *)(param_1 + 0x7b) == '\0') &&
       ((uVar8 = FUN_004d48e0(param_1,0), uVar9 = extraout_var_01, uVar8 != 0 &&
        ((*(byte *)(param_1 + 0xe) & 0x10) == 0)))) {
      *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
      empty_unit_function(param_1);
      bVar10 = false;
      *(undefined1 *)(param_1 + 0x2c) = 5;
      init_unit_class(param_1);
      puVar1 = (undefined2 *)(uVar8 + 0x24);
      uVar8 = CONCAT22(extraout_var,*puVar1);
      *(undefined2 *)(param_1 + 0x72) = *puVar1;
      uVar9 = extraout_var_02;
    }
    if (!bVar10) goto switchD_004d621e_caseD_4;
    if (((*(char *)(param_1 + 0x7c) == '\0') &&
        (uVar8 = FUN_004d4a00(param_1 + 0x3d,local_4,CONCAT22(uVar9,*(undefined2 *)(param_1 + 0x5d))
                              ,unit_type_array_person[1]._9_1_), (char)uVar8 != '\0')) &&
       ((*(byte *)(param_1 + 0xe) & 0x10) == 0)) {
      *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
      empty_unit_function(param_1);
      bVar10 = false;
      *(undefined1 *)(param_1 + 0x2c) = 6;
      init_unit_class(param_1);
      uVar8 = FUN_004e9dd0(param_1,local_4);
    }
  }
  if (bVar10) {
    uVar8 = (uint)*(byte *)(param_1 + 0x2d);
    switch(uVar8) {
    case 0:
      uVar8 = FUN_004d66e0(param_1);
      if (uVar8 == 0) {
        uVar8 = *(uint *)(param_1 + 0xc);
        if ((uVar8 & 0x40000000) != 0) {
          *(uint *)(param_1 + 0xc) = uVar8 & 0xbfffffff;
          uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar7 = uVar8 >> 0xd;
          game_state.pseudo_random_val = uVar7 | uVar8 * 0x80000;
          *(ushort *)(param_1 + 0x70) = ((ushort)uVar7 & 0x1f) + 0x20;
          FUN_004d6660(param_1);
          FUN_004d3ff0(param_1,(-(uint)(*(short *)(param_1 + 0x78) == 0) & 0xfffffffc) + 5);
          uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar3 = uVar8 >> 0xd;
          uVar8 = uVar8 * 0x80000;
          game_state.pseudo_random_val = uVar3 | uVar8;
          update_gs_unit_related_array_item(param_1);
          uVar7 = *(uint *)(param_1 + 0xc);
          *(uint *)(param_1 + 0xc) = uVar7 | 0x80;
          *(uint *)(param_1 + 0xc) = uVar7 | 0x1080;
          uVar3 = uVar3 & 0xffff07ff;
          uVar8 = uVar3 | uVar8;
          *(short *)(param_1 + 0x57) = (short)uVar3;
        }
        psVar2 = (short *)(param_1 + 0x70);
        *psVar2 = *psVar2 + -1;
        if (*psVar2 < 0) {
          *(undefined1 *)(param_1 + 0x2d) = 1;
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
          return uVar8 & 0xffffff00;
        }
      }
      break;
    case 1:
      uVar8 = FUN_004d66e0(param_1);
      if (uVar8 == 0) {
        uVar8 = *(uint *)(param_1 + 0xc);
        if ((uVar8 & 0x40000000) != 0) {
          *(uint *)(param_1 + 0xc) = uVar8 & 0xbfffffff;
          uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar7 = uVar8 >> 0xd;
          game_state.pseudo_random_val = uVar7 | uVar8 * 0x80000;
          *(undefined2 *)(param_1 + 0x5f) = 0;
          *(ushort *)(param_1 + 0x70) = ((ushort)uVar7 & 0x3f) + 0x40;
          uVar8 = FUN_004d3ff0(param_1,(*(short *)(param_1 + 0x78) == 0) - 1U & 4);
        }
        if ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0) {
          uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar3 = uVar8 >> 0xd;
          uVar8 = uVar8 * 0x80000;
          game_state.pseudo_random_val = uVar3 | uVar8;
          update_gs_unit_related_array_item(param_1);
          uVar7 = *(uint *)(param_1 + 0xc);
          *(uint *)(param_1 + 0xc) = uVar7 | 0x80;
          *(uint *)(param_1 + 0xc) = uVar7 | 0x1080;
          uVar3 = uVar3 & 0xffff07ff;
          uVar8 = uVar3 | uVar8;
          *(short *)(param_1 + 0x57) = (short)uVar3;
        }
        psVar2 = (short *)(param_1 + 0x70);
        *psVar2 = *psVar2 + -1;
        if (*psVar2 < 0) {
          *(undefined1 *)(param_1 + 0x2d) = 0;
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
          return uVar8 & 0xffffff00;
        }
      }
      break;
    case 2:
      uVar8 = *(uint *)(param_1 + 0xc);
      if ((uVar8 & 0x40000000) != 0) {
        *(undefined2 *)(param_1 + 0x70) = 0x20;
        *(uint *)(param_1 + 0xc) = uVar8 & 0xbfffffff;
        FUN_004d6660(param_1);
        FUN_004d3ff0(param_1,(-(uint)(*(short *)(param_1 + 0x78) == 0) & 0xfffffffc) + 5);
        bVar4 = (byte)unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x7 >> 1;
        uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        game_state.pseudo_random_val = uVar7 >> 0xd | uVar7 * 0x80000;
        *(byte *)(param_1 + 0x7b) = bVar4 + (char)(game_state.pseudo_random_val % (uint)bVar4);
        bVar4 = (byte)unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x8 >> 1;
        uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        game_state.pseudo_random_val = uVar7 >> 0xd | uVar7 * 0x80000;
        uVar8 = game_state.pseudo_random_val / bVar4;
        *(byte *)(param_1 + 0x7c) = bVar4 + (char)(game_state.pseudo_random_val % (uint)bVar4);
      }
      psVar2 = (short *)(param_1 + 0x70);
      *psVar2 = *psVar2 + -1;
      if (*psVar2 < 0) {
        *(undefined1 *)(param_1 + 0x2d) = 1;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        return uVar8 & 0xffffff00;
      }
      break;
    case 3:
      uVar8 = *(uint *)(param_1 + 0xc);
      bVar10 = (uVar8 & 0x40000000) != 0;
      if (bVar10) {
        uVar8 = uVar8 & 0xbfffffff;
        *(undefined2 *)(param_1 + 0x70) = 0x40;
        *(uint *)(param_1 + 0xc) = uVar8;
      }
      *(undefined1 *)(param_1 + 0x7b) = 0x10;
      *(undefined1 *)(param_1 + 0x7c) = 0x10;
      if ((*(byte *)(param_1 + 0x2e) & 3) == 0 || bVar10) {
        cVar5 = FUN_00518200(param_1 + 0x3d,0);
        if (cVar5 == '\x04') {
          *(undefined2 *)(param_1 + 0x70) = 0x40;
          uVar6 = FUN_00465580(param_1 + 0x3d,0);
          update_gs_unit_related_array_item(param_1);
          *(ushort *)(param_1 + 0x57) = uVar6;
          *(ushort *)(param_1 + 0x5d) = uVar6;
          uVar7 = *(uint *)(param_1 + 0xc);
          *(uint *)(param_1 + 0xc) = uVar7 | 0x80;
          *(uint *)(param_1 + 0xc) = uVar7 | 0x1080;
          if ((uVar7 & 0x8000) != 0) {
            uVar6 = uVar6 + 0x400 & 0x7ff;
          }
          *(ushort *)(param_1 + 0x26) = uVar6;
          FUN_004d6660(param_1);
          uVar8 = FUN_004d3ff0(param_1,(-(uint)(*(short *)(param_1 + 0x78) == 0) & 0xfffffffc) + 5);
        }
        else {
          *(undefined2 *)(param_1 + 0x5f) = 0;
          uVar6 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
          if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
             (uVar6 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
            uVar6 = 2;
            *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
          }
          uVar8 = unit_set_object_upper
                            (param_1,unit_type_to_obj_indexes_map
                                     [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar6 * 9]);
        }
      }
      psVar2 = (short *)(param_1 + 0x70);
      *psVar2 = *psVar2 + -1;
      if (*psVar2 < 0) {
        *(undefined1 *)(param_1 + 0x2d) = 0;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
    }
  }
switchD_004d621e_caseD_4:
  return uVar8 & 0xffffff00;
}
