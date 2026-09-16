/* Ghidra 12.1.3 pseudocode; entry 004641d0; FUN_004641d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004641d0(int param_1)

{
  uint *puVar1;
  undefined1 uVar2;
  unit_struct *puVar3;
  char cVar4;
  char cVar5;
  int iVar6;
  uint uVar7;
  uint uVar8;
  unit_struct *puVar9;
  int iVar10;
  ushort *puVar11;
  int iVar12;

  iVar12 = 0;
  if (*(char *)(param_1 + 0x9f) != '\0') {
    *(char *)(param_1 + 0x9f) = *(char *)(param_1 + 0x9f) + -1;
  }
  if ((*(byte *)(param_1 + 0xc) & 4) != 0) {
    *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 0x8000;
  }
  if ((*(uint *)(param_1 + 0x92) & 0x8000) != 0) {
    *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) & 0xffff7fff;
    if ((unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15 & 1) == 0) {
      FUN_004e7fb0();
    }
    else {
      FUN_004e8f00(param_1);
    }
    *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 2;
  }
  if (*(short *)(param_1 + 0x9a) != 0) {
    *(short *)(param_1 + 0x9a) = *(short *)(param_1 + 0x9a) + -1;
  }
  iVar6 = FUN_00466760(param_1);
  if (iVar6 != 0) {
    iVar12 = (int)*(short *)(iVar6 + 0x5f);
  }
  cVar4 = '\0';
  if (iVar12 == 0) {
    if (*(short *)(param_1 + 0x5f) < 2) {
      *(undefined2 *)(param_1 + 0x43) = 0;
      puVar11 = (ushort *)(param_1 + 0x3d);
      *(undefined2 *)(param_1 + 0x47) = 0;
      *(undefined2 *)(param_1 + 0x45) = 0;
      if (((*puVar11 & 0xfe00) - (uint)*puVar11 == -0x100) &&
         ((*(ushort *)(param_1 + 0x3f) & 0xfe00) - (uint)*(ushort *)(param_1 + 0x3f) == -0x100)) {
        if ((unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15 & 1) == 0) {
          cVar4 = FUN_004650d0(param_1,puVar11);
        }
        else {
          cVar4 = '\0';
          uVar7 = FUN_00404c50(puVar11);
          uVar8 = (uVar7 & 0xfe) * 2 | uVar7 & 0xfe00;
          puVar1 = &game_state.level_data[0].flags + uVar8;
          if (((((*puVar1 & 0x204) == 0) && (cVar5 = FUN_00465510(uVar7,param_1), cVar5 != '\0')) &&
              (((param_1 != 0 && (*(char *)(param_1 + 0x9e) != '\0')) ||
               ((*(byte *)(landscape_height_array +
                          ((&game_state.level_data[0].c_3)[uVar8 * 4] & 0xf)) & 0x3d) != 0)))) &&
             ((*puVar1 & 2) == 0)) {
            cVar4 = '\x01';
          }
        }
      }
      if (cVar4 == '\0') {
        FUN_00466fc0(param_1,0xc);
      }
      else {
        *(undefined2 *)(param_1 + 0x5f) = 0;
        FUN_0048a770(0x4e,param_1);
        uVar2 = unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0xa;
        if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
          empty_unit_function(param_1);
          *(undefined1 *)(param_1 + 0x2c) = uVar2;
          init_unit_class(param_1);
        }
      }
      goto LAB_00464462;
    }
    iVar10 = (int)(char)unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x8;
    if ((*(char *)(param_1 + 0x9e) != '\0') && (0 < iVar10)) {
      puVar11 = (ushort *)(param_1 + 0x7a);
      do {
        puVar9 = (unit_struct *)0x0;
        if (((*puVar11 != 0) &&
            (puVar3 = unit_land_array[*puVar11], (*(byte *)&puVar3->flags_2 & 1) == 0)) &&
           (puVar3->unit_class != '\0')) {
          puVar9 = puVar3;
        }
        if (puVar9 != (unit_struct *)0x0) {
          FUN_004d3ea0(puVar9);
        }
        puVar11 = puVar11 + 1;
        iVar10 = iVar10 + -1;
      } while (iVar10 != 0);
    }
  }
  FUN_00466a20(param_1,iVar6,iVar12);
  FUN_004e89a0(param_1);
  if (iVar12 != 0) {
    FUN_004eb9a0(param_1,iVar6);
  }
  if ((*(byte *)(param_1 + 0x10) & 0x10) == 0) {
    FUN_0048a050(param_1,0x4e,0x40);
  }
LAB_00464462:
  FUN_00465ea0(param_1);
  return;
}
