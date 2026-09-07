/* Ghidra 12.1.3 pseudocode; entry 004a5ef0; init_unit_type_5.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_type_5(int param_1)

{
  undefined1 uVar1;
  byte bVar2;
  uint uVar3;
  unit_related_struct_20B *puVar4;
  undefined2 uVar5;
  int iVar6;
  undefined2 extraout_var;
  undefined2 uVar7;
  uint uVar8;
  undefined2 extraout_var_00;
  int iVar9;
  unit_struct *puVar10;
  ushort local_a;
  ushort local_8;

  if ((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].flags & 4) == 0) {
    iVar9 = 0x89d1c8;
    bVar2 = (byte)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
    local_a = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),bVar2) & 0xfefe;
    iVar6 = 0;
    do {
      if ((((*(char *)(iVar9 + 0xc20) != '\0') && (*(int *)(iVar9 + 0x949) == 0)) &&
          (uVar3 = (int)(short)(((bVar2 & 0xfe) + 1) * 0x100) - (int)*(short *)(iVar9 + 0x911),
          uVar8 = (int)uVar3 >> 0x1f, (int)((uVar3 ^ uVar8) - uVar8) < 0xe00)) &&
         (uVar3 = (int)(short)(((local_a >> 8) + 1) * 0x100) - (int)*(short *)(iVar9 + 0x913),
         uVar8 = (int)uVar3 >> 0x1f, (int)((uVar3 ^ uVar8) - uVar8) < 0xe00)) {
        game_state.start_24[iVar6] = 1;
      }
      iVar6 = iVar6 + 1;
      iVar9 = iVar9 + 0xc65;
    } while (iVar6 < 4);
  }
  uVar3 = (uint)*(byte *)(param_1 + 0x2b);
  switch(uVar3) {
  case 1:
  case 2:
  case 3:
  case 4:
  case 5:
  case 6:
  case 7:
  case 8:
  case 0xe:
  case 0xf:
  case 0x12:
  case 0x13:
    FUN_004a67d0(param_1);
    break;
  case 9:
    FUN_004a67d0(param_1);
    uVar3 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x40000;
    *(undefined1 *)(param_1 + 0x78) = 4;
    *(uint *)(param_1 + 0xc) = uVar3 | 4;
    if (game_state.offset_counter_2 < 3) {
      FUN_004a9030(param_1,0);
    }
    else if ((uVar3 & 0x100000) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 0xb;
      init_unit_class(param_1);
    }
    break;
  case 10:
    FUN_004a6b20(param_1);
    break;
  case 0xb:
    FUN_004a6cc0(param_1);
    break;
  case 0xc:
    FUN_004a7d80(param_1);
    break;
  case 0xd:
    FUN_004a67d0(param_1);
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x100;
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x100;
    uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar3 = uVar8 >> 0xd;
    *(ushort *)(param_1 + 0x3d) =
         ((ushort)uVar3 ^ *(ushort *)(param_1 + 0x3d)) & 0x1ff ^ *(ushort *)(param_1 + 0x3d);
    local_8 = (ushort)((uVar3 | uVar8 * 0x80000) * 0x24a1 + 0x24df >> 0xd);
    *(ushort *)(param_1 + 0x3f) =
         (*(ushort *)(param_1 + 0x3f) ^ local_8) & 0x1ff ^ *(ushort *)(param_1 + 0x3f);
    FUN_004e90e0(param_1);
    break;
  case 0x10:
    *(undefined1 *)(param_1 + 0x2f) = 0xff;
    uVar1 = unit_type_array_scenery[uVar3].field9_0x11;
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = uVar1;
      init_unit_class(param_1);
    }
    insert_unit_into_land_tile(param_1,param_1 + 0x3d);
    *(undefined1 *)(param_1 + 0x30) = unit_type_array_scenery[uVar3].field10_0x12;
    FUN_004a66c0(param_1,CONCAT22(extraout_var_00,unit_type_array_scenery[uVar3].obj_related_index),
                 CONCAT22(extraout_var,unit_type_array_scenery[uVar3].obj_index));
    break;
  case 0x11:
    uVar5 = 0;
    uVar7 = 0;
    puVar10 = (unit_struct *)0x0;
    *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x10;
    if ((*(uint *)(param_1 + 0xc) & 0x400) == 0) {
      puVar4 = (unit_related_struct_20B *)0x0;
    }
    else {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffbff;
      ptr_unit_related_20B = ptr_unit_related_20B + -1;
      puVar4 = ptr_unit_related_20B;
    }
    if (puVar4 != (unit_related_struct_20B *)0x0) {
      uVar5 = (undefined2)puVar4->field0_0x0;
      uVar7 = (undefined2)puVar4->field1_0x4;
      puVar10 = puVar4->unit_ptr;
    }
    *(undefined2 *)(param_1 + 0x68) = uVar5;
    *(unit_struct **)(param_1 + 0x6c) = puVar10;
    *(undefined2 *)(param_1 + 0x6a) = uVar7;
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 9;
      init_unit_class(param_1);
    }
  }
  if ((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].flags_1 & 4) != 0) {
    FUN_00494f50(param_1);
  }
  return;
}
