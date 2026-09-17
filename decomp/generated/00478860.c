/* Ghidra 12.1.3 pseudocode; entry 00478860; FUN_00478860.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00478860(undefined4 param_1)

{
  ushort *puVar1;
  char cVar2;
  undefined2 uVar3;
  int iVar4;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  int iVar5;
  int iVar6;
  undefined2 local_c;
  undefined2 local_a;
  undefined2 local_8;
  undefined2 local_6;
  undefined2 local_4;

  iVar5 = 0x89d1c8;
  iVar6 = 0;
  if (game_state.num_tribes != 0) {
    do {
      cVar2 = FUN_00419480(iVar6);
      if (cVar2 == '\0') {
        if (*(int *)(iVar5 + 0x89d) == 0) {
          iVar4 = FUN_004da0f0(7,iVar6,iVar5 + 0x911,0);
          *(int *)(iVar5 + 0x89d) = iVar4;
          if (iVar4 != 0) {
            *(undefined2 *)(iVar4 + 0x5d) = 0;
          }
        }
        if (*(int *)(iVar5 + 0x89d) != 0) {
          FUN_004783a0(param_1,0,(int)*(char *)(*(int *)(iVar5 + 0x89d) + 0x2f),&local_c);
          local_4 = 0;
          local_8 = local_c;
          local_6 = local_a;
          add_unit_to_cell(*(undefined4 *)(iVar5 + 0x89d),&local_8);
          iVar4 = *(int *)(iVar5 + 0x89d);
          uVar3 = calc_point_height(CONCAT22(extraout_var,*(undefined2 *)(iVar4 + 0x3d)),
                                    CONCAT22(extraout_var_00,*(undefined2 *)(iVar4 + 0x3f)));
          *(undefined2 *)(iVar4 + 0x41) = uVar3;
          *(uint *)(iVar4 + 0x10) = *(uint *)(iVar4 + 0x10) & 0xfffffbff;
          iVar4 = *(int *)(iVar5 + 0x89d);
          *(undefined2 *)(iVar4 + 0x43) = 0;
          *(undefined2 *)(iVar4 + 0x47) = 0;
          *(undefined2 *)(iVar4 + 0x45) = 0;
          FUN_004d4d10(*(undefined4 *)(iVar5 + 0x89d),0);
          puVar1 = (ushort *)(*(int *)(iVar5 + 0x89d) + 0x35);
          *puVar1 = *puVar1 & 0xffef;
        }
      }
      iVar6 = iVar6 + 1;
      iVar5 = iVar5 + 0xc65;
    } while (iVar6 < (int)(uint)game_state.num_tribes);
  }
  return;
}
