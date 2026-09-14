/* Ghidra 12.1.3 pseudocode; entry 004e67b0; FUN_004e67b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e67b0(undefined4 param_1,uint param_2,undefined1 param_3,undefined1 param_4)

{
  unit_struct *puVar1;
  int iVar2;
  int iVar3;
  ushort *puVar4;
  unit_struct *puVar5;
  int iVar6;
  undefined2 unaff_retaddr;
  undefined2 uStack_2;

  iVar2 = get_tribe_sub_struct(param_1);
  if (iVar2 != -1) {
    iVar3 = find_drum_tower(param_1,CONCAT22(unaff_retaddr,CONCAT11(param_4,param_3)));
    if (iVar3 != 0) {
      iVar6 = 0;
      if (unit_type_array_building[4].field31_0x20 != 0) {
        puVar4 = (ushort *)(iVar3 + 0x86);
        do {
          puVar5 = (unit_struct *)0x0;
          if (((*puVar4 != 0) &&
              (puVar1 = unit_land_array[*puVar4], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
             (puVar1->unit_class != '\0')) {
            puVar5 = puVar1;
          }
          if (puVar5 != (unit_struct *)0x0) {
            if ((byte)puVar5->unit_type == param_2) {
              return;
            }
            if (puVar5->unit_type == 7) {
              return;
            }
          }
          puVar4 = puVar4 + 1;
          iVar6 = iVar6 + 1;
        } while (iVar6 < (int)(uint)unit_type_array_building[4].field31_0x20);
      }
      set_sub_struct(param_1,iVar2,7,*(undefined2 *)(iVar3 + 0x24),param_2,0,0);
    }
  }
  return;
}
