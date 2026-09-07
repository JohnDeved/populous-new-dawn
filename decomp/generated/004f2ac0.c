/* Ghidra 12.1.3 pseudocode; entry 004f2ac0; FUN_004f2ac0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f2ac0(int param_1,uint param_2,int param_3)

{
  unit_struct *puVar1;
  int iVar2;
  ushort *puVar3;
  uint uVar4;
  char *pcVar5;
  unit_struct *puVar6;
  int iVar7;

  iVar2 = 0;
  puVar3 = (ushort *)(param_1 + 0x68);
  iVar7 = 0;
  do {
    if ((((*(uint *)(puVar3 + 6) & 1) != 0) && (*(char *)((int)puVar3 + 0x1d) == '\x06')) &&
       (iVar7 != param_3)) {
      puVar6 = (unit_struct *)0x0;
      if (((*puVar3 != 0) && (puVar1 = unit_land_array[*puVar3], (puVar1->flags_2 & 1) == 0)) &&
         (puVar1->unit_class != '\0')) {
        puVar6 = puVar1;
      }
      if (((puVar6 != (unit_struct *)0x0) && (puVar6->unit_class == '\x02')) &&
         ((byte)puVar6->unit_type == param_2)) {
        switch(puVar3[8]) {
        case 0:
        case 2:
          iVar2 = iVar2 + 5;
          break;
        case 3:
        case 4:
          iVar2 = iVar2 + *(int *)(puVar3 + -0x15);
          break;
        case 5:
        case 6:
          iVar2 = iVar2 + *(int *)(puVar3 + -0x17);
        }
      }
    }
    puVar3 = puVar3 + 0x29;
    iVar7 = iVar7 + 1;
  } while (iVar7 < 10);
  for (iVar7 = *(int *)(param_1 + 0x881); iVar7 != 0; iVar7 = *(int *)(iVar7 + 8)) {
    if ((*(char *)(iVar7 + 0x2c) == '\n') || (*(char *)(iVar7 + 0x2c) == '!')) {
      pcVar5 = (char *)0x0;
      uVar4 = (uint)*(ushort *)(iVar7 + 0x9b);
      if ((uVar4 != 0) ||
         (uVar4 = (uint)*(ushort *)(iVar7 + 0x8b + (uint)*(byte *)(iVar7 + 0xa6) * 2), uVar4 != 0))
      {
        pcVar5 = (char *)((int)(game_state.sunlight_array + 0x32) + uVar4 * 10);
      }
      if (((pcVar5 != (char *)0x0) && ((pcVar5[1] & 1U) == 0)) && (*pcVar5 == '\b')) {
        puVar6 = (unit_struct *)0x0;
        if (((*(ushort *)(iVar7 + 0x72) != 0) &&
            (puVar1 = unit_land_array[*(ushort *)(iVar7 + 0x72)], (puVar1->flags_2 & 1) == 0)) &&
           (puVar1->unit_class != '\0')) {
          puVar6 = puVar1;
        }
        if ((puVar6 != (unit_struct *)0x0) && ((byte)puVar6->unit_type == param_2)) {
          iVar2 = iVar2 + 1;
        }
      }
    }
  }
  return iVar2;
}
