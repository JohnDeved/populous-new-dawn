/* Ghidra 12.1.3 pseudocode; entry 005030c0; FUN_005030c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_005030c0(int param_1)

{
  short sVar1;
  unit_struct *puVar2;
  int iVar3;
  short sVar4;
  int iVar5;
  unit_struct *puVar6;

  DAT_0089c65d = 0;
  for (puVar2 = allocated_units_2; puVar2 != (unit_struct *)0x0; puVar2 = puVar2->next_unit_1) {
    if ((puVar2->unit_class == '\n') && (puVar2->unit_type == '\x10')) {
      DAT_0089c65d = DAT_0089c65d + 1;
    }
  }
  DAT_0089ce61 = 0;
  if (DAT_0089c65d < 0x21) {
    DAT_0089ce61 = 8;
  }
  if (DAT_0089c65d < 0x16) {
    DAT_0089ce61 = 4;
  }
  if (DAT_0089c65d < 0xd) {
    DAT_0089ce61 = 2;
  }
  if (0x3f < DAT_0089c65d) {
    puVar6 = (unit_struct *)0x0;
    sVar4 = 0;
    for (puVar2 = allocated_units_2; puVar2 != (unit_struct *)0x0; puVar2 = puVar2->next_unit_1) {
      if (((puVar2->unit_class == '\n') && (puVar2->unit_type == '\x10')) &&
         (sVar1._0_1_ = puVar2->coord_scale_3, sVar1._1_1_ = puVar2->coord_scale_1, sVar4 < sVar1))
      {
        puVar6 = puVar2;
        sVar4 = sVar1;
      }
    }
    iVar5 = 0;
    if (puVar6 == (unit_struct *)0x0) {
      puVar6 = (unit_struct *)0x0;
      for (puVar2 = allocated_units_2; puVar2 != (unit_struct *)0x0; puVar2 = puVar2->next_unit_1) {
        if (((puVar2->unit_class == '\n') && (puVar2->unit_type == '\x10')) &&
           (iVar3 = calc_distance_toroidal(param_1 + 0x3d,&puVar2->pos), iVar5 < iVar3)) {
          iVar5 = iVar3;
          puVar6 = puVar2;
        }
      }
      if (puVar6 != (unit_struct *)0x0) {
        if (DAT_0089c65d != 0) {
          DAT_0089c65d = DAT_0089c65d + -1;
        }
        FUN_004ee1e0(puVar6);
        FUN_005030c0(puVar6);
        if ((*(byte *)&puVar6->flags_4 & 0x10) != 0) {
          FUN_0048a770(0xc0,puVar6);
          return;
        }
      }
    }
    else {
      if (DAT_0089c65d != 0) {
        DAT_0089c65d = DAT_0089c65d + -1;
      }
      FUN_004ee1e0(puVar6);
      FUN_005030c0(puVar6);
      if ((*(byte *)&puVar6->flags_4 & 0x10) != 0) {
        FUN_0048a770(0xc0,puVar6);
      }
    }
  }
  return;
}
