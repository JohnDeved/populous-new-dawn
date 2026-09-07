/* Ghidra 12.1.3 pseudocode; entry 004da5b0; FUN_004da5b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004da5b0(int param_1)

{
  unit_struct *puVar1;
  bool bVar2;
  char cVar3;
  undefined2 uVar4;
  ushort uVar5;
  uint uVar6;
  uint uVar7;
  short sVar8;
  unit_struct *puVar9;
  undefined1 local_d;
  undefined1 local_c [8];
  uint local_4;

  puVar9 = (unit_struct *)0x0;
  local_d = 0;
  if (((*(ushort *)(param_1 + 0x89) != 0) &&
      (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x89)], (*(byte *)&puVar1->flags_2 & 1) == 0))
     && (puVar1->unit_class != '\0')) {
    puVar9 = puVar1;
  }
  if (puVar9 == (unit_struct *)0x0) {
    local_d = 1;
  }
  else if (*(char *)(param_1 + 0xa9) == '\0') {
    if ((*(ushort *)(param_1 + 0x76) & 0x100) != 0) {
      *(undefined1 *)(param_1 + 0xa8) = 0x2f;
      uVar5 = *(ushort *)(param_1 + 0x76) & 0xfeff;
      *(ushort *)(param_1 + 0x76) = uVar5;
      *(undefined2 *)(param_1 + 0x70) = 0;
      *(ushort *)(param_1 + 0x76) = uVar5 | 0x10;
      uVar6 = *(uint *)(param_1 + 0x10) & 0xfffefff8;
      *(uint *)(param_1 + 0x10) = uVar6;
      *(uint *)(param_1 + 0x10) = uVar6 | 2;
    }
    uVar4 = FUN_0040a0a0(puVar9,local_c);
    *(undefined2 *)(param_1 + 0x1c) = uVar4;
    switch(*(undefined1 *)(param_1 + 0xa8)) {
    case 0x1f:
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
        FUN_004d6660(param_1);
        FUN_004d3ff0(param_1,(-(uint)(*(short *)(param_1 + 0x78) == 0) & 0xfffffffc) + 5);
        get_building_coords(puVar9,local_c);
        FUN_004e9dd0(param_1,local_c);
      }
      if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
        uVar6 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
        uVar7 = (int)uVar6 >> 0x1f;
        if ((0x6f < (int)((uVar6 ^ uVar7) - uVar7)) ||
           (uVar6 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
           uVar7 = (int)uVar6 >> 0x1f, bVar2 = true, 0x6f < (int)((uVar6 ^ uVar7) - uVar7))) {
          bVar2 = false;
        }
        if (bVar2) {
          *(undefined1 *)(param_1 + 0xa9) = 1;
          *(byte *)(param_1 + 0x77) = *(byte *)(param_1 + 0x77) | 1;
          return 0;
        }
      }
      break;
    case 0x2f:
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
        FUN_004d6660(param_1);
        FUN_004d3ff0(param_1,(-(uint)(*(short *)(param_1 + 0x78) == 0) & 0xfffffffc) + 5);
        FUN_00409f90(puVar9,local_c);
        FUN_004e9dd0(param_1,local_c);
      }
      if (((*(byte *)(param_1 + 0x2e) & 1) == 0) &&
         (cVar3 = FUN_00432da0(param_1 + 0x3d,0x38,param_1 + 0x4f,0x200), cVar3 != '\0')) {
        *(undefined1 *)(param_1 + 0xa8) = 0x30;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        return 0;
      }
      break;
    case 0x30:
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
        FUN_00409f90(puVar9,local_c);
        uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar6 = uVar7 >> 0xd;
        game_state.pseudo_random_val = uVar6 | uVar7 * 0x80000;
        uVar6 = uVar6 & 0x7ff;
        local_4 = game_state.pseudo_random_val;
        move_pos_angle_length
                  (local_c,uVar6,
                   *(undefined2 *)&unit_type_array_building[(byte)puVar9->unit_type].field_0x24);
        FUN_004e9dd0(param_1,local_c);
        uVar5 = (ushort)uVar6;
        if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
          *(ushort *)(param_1 + 0x57) = uVar5;
        }
        *(ushort *)(param_1 + 0x5d) = uVar5;
        if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
          uVar5 = uVar5 + 0x400 & 0x7ff;
        }
        *(ushort *)(param_1 + 0x26) = uVar5;
      }
      if (((*(byte *)(param_1 + 0x2e) & 1) == 0) &&
         (cVar3 = FUN_00432da0(param_1 + 0x3d,0x38,param_1 + 0x4f,0x38), cVar3 != '\0')) {
        *(undefined1 *)(param_1 + 0xa8) = 0x31;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        return 0;
      }
      break;
    case 0x31:
      if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
        *(undefined2 *)(param_1 + 0x5f) = 0;
        sVar8 = 6;
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
        if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
           (sVar8 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
          sVar8 = 2;
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
        }
        unit_set_object_upper
                  (param_1,unit_type_to_obj_indexes_map[(uint)*(byte *)(param_1 + 0x2b) + sVar8 * 9]
                  );
        uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar6 = uVar7 >> 0xd;
        game_state.pseudo_random_val = uVar6 | uVar7 * 0x80000;
        *(byte *)(param_1 + 0xaa) = ((byte)uVar6 & 0x1f) + 0x10;
      }
      *(short *)(param_1 + 0x70) = *(short *)(param_1 + 0x70) + 1;
      cVar3 = *(char *)(param_1 + 0xaa) + -1;
      *(char *)(param_1 + 0xaa) = cVar3;
      if (cVar3 == '\0') {
        *(undefined1 *)(param_1 + 0xa8) = 0x2f;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        return 0;
      }
    }
  }
  else {
    if (*(char *)(param_1 + 0xa9) != '\x01') {
      return 0;
    }
    if ((*(ushort *)(param_1 + 0x76) & 0x100) != 0) {
      *(undefined2 *)(param_1 + 0x1c) = 0;
      *(undefined1 *)(param_1 + 0xa8) = 2;
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffefff8;
      uVar5 = *(ushort *)(param_1 + 0x76) & 0xfeff;
      *(ushort *)(param_1 + 0x76) = uVar5;
      *(ushort *)(param_1 + 0x76) = uVar5 | 0x10;
    }
    cVar3 = FUN_00496750(param_1,0);
    if (cVar3 != '\0') {
      *(undefined1 *)(param_1 + 0xa9) = 0;
      *(byte *)(param_1 + 0x77) = *(byte *)(param_1 + 0x77) | 1;
      return 0;
    }
  }
  return local_d;
}
