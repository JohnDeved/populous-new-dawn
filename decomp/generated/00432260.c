/* Ghidra 12.1.3 pseudocode; entry 00432260; FUN_00432260.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00432260(int param_1)

{
  unit_struct *puVar1;
  char cVar2;
  short sVar3;
  undefined2 uVar4;
  uint uVar5;
  uint uVar6;
  int iVar7;
  unit_struct *puVar8;
  char local_19;
  undefined4 local_18;
  uint local_14;
  undefined4 local_10;
  undefined1 local_c [4];
  undefined4 local_8;
  undefined2 local_4;

  if ((*(short *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2) == 0) &&
     (*(short *)(param_1 + 0x9b) == 0)) {
    return;
  }
  *(undefined1 *)(param_1 + 0xaa) = 0;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xefffffff;
  uVar6 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].
                          field_0x4 >> 2;
  if (uVar6 == 0) {
    uVar6 = 1;
  }
  uVar5 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  local_14 = uVar5 >> 0xd | uVar5 * 0x80000;
  sVar3 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].field_0x4 +
          (short)(local_14 % uVar6);
  game_state.pseudo_random_val = local_14;
  *(short *)(param_1 + 0x5f) = sVar3;
  if ((*(byte *)(param_1 + 0x16) & 8) != 0) {
    *(short *)(param_1 + 0x5f) = sVar3 * 2;
  }
  FUN_00432df0(param_1);
  FUN_0043d510(param_1);
  if ((*(uint *)(param_1 + 0x14) & 0x80) != 0) {
    if (*(short *)(param_1 + 0x9f) != 0) {
      iVar7 = 0;
      uVar6 = (uint)*(ushort *)(param_1 + 0x9b);
      if ((uVar6 != 0) ||
         (uVar6 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2),
         uVar6 != 0)) {
        iVar7 = uVar6 * 10 + 0x938830;
      }
      if (iVar7 != 0) {
        puVar8 = (unit_struct *)0x0;
        FUN_004389c0(iVar7,local_c);
        if (((*(ushort *)(param_1 + 0x9f) != 0) &&
            (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x9f)],
            (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
          puVar8 = puVar1;
        }
        if (puVar8 != (unit_struct *)0x0) {
          uVar4 = FUN_004324c0((undefined4 *)(param_1 + 0x3d),local_c);
          local_8 = *(undefined4 *)(param_1 + 0x3d);
          local_4 = *(undefined2 *)(param_1 + 0x41);
          move_pos_angle_length(&local_8,uVar4,0x300);
          cVar2 = FUN_00518200(&local_8,0);
          if (cVar2 != '\0') {
            local_19 = FUN_00466190(puVar8,&local_18);
            local_4 = 0;
            local_8 = local_18;
          }
          if (local_19 == '\0') goto LAB_00432487;
          local_18 = local_8;
          FUN_004659d0(puVar8,param_1,&local_18);
          local_10 = local_18;
          FUN_00432520(param_1,&local_10);
          FUN_00402e70(param_1,&local_10);
        }
        if (local_19 != '\0') {
          *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffff7f;
        }
        goto LAB_00432487;
      }
    }
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffff7f;
  }
LAB_00432487:
  if (((*(byte *)(param_1 + 0x13) & 0x10) != 0) && ((*(byte *)(param_1 + 0xe) & 0x10) == 0)) {
    *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x21;
    init_unit_class(param_1);
  }
  return;
}
