/* Ghidra 12.1.3 pseudocode; entry 0043d510; FUN_0043d510.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0043d510(int param_1)

{
  unit_struct *puVar1;
  bool bVar2;
  char cVar3;
  uint uVar4;
  int iVar5;
  int iVar6;
  unit_struct *puVar7;

  bVar2 = true;
  if ((*(byte *)(param_1 + 0xe) & 0x80) == 0) {
    return;
  }
  switch(*(undefined1 *)(param_1 + 0xa7)) {
  case 8:
    iVar6 = 0;
    uVar4 = (uint)*(ushort *)(param_1 + 0x9b);
    if ((uVar4 != 0) ||
       (uVar4 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2), uVar4 != 0)
       ) {
      iVar6 = uVar4 * 10 + 0x938830;
    }
    if (((iVar6 == 0) || (iVar5 = get_adjacent_unit(param_1,0), iVar5 == 0)) ||
       (*(short *)(iVar6 + 6) != *(short *)(iVar5 + 0x24))) goto switchD_0043d53f_caseD_9;
    break;
  default:
    goto switchD_0043d53f_caseD_9;
  case 0x15:
    if ((*(char *)(param_1 + 0x2b) != '\x06') || (iVar6 = get_adjacent_unit(param_1,4), iVar6 == 0))
    goto switchD_0043d53f_caseD_9;
    break;
  case 0x1c:
    if ((*(char *)(param_1 + 0x2b) != '\x06') || (iVar6 = get_adjacent_unit(param_1,4), iVar6 == 0))
    goto switchD_0043d53f_caseD_9;
    iVar6 = 0;
    uVar4 = (uint)*(ushort *)(param_1 + 0x9b);
    if ((uVar4 != 0) ||
       (uVar4 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2), uVar4 != 0)
       ) {
      iVar6 = uVar4 * 10 + 0x938830;
    }
    if (iVar6 == 0) goto switchD_0043d53f_caseD_9;
    puVar7 = (unit_struct *)0x0;
    if (((*(ushort *)(iVar6 + 6) != 0) &&
        (puVar1 = unit_land_array[*(ushort *)(iVar6 + 6)], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
       (puVar1->unit_class != '\0')) {
      puVar7 = puVar1;
    }
    if ((puVar7 == (unit_struct *)0x0) || (cVar3 = FUN_00520170(param_1,puVar7), cVar3 == '\0'))
    goto switchD_0043d53f_caseD_9;
    break;
  case 0x1f:
    break;
  }
  bVar2 = false;
switchD_0043d53f_caseD_9:
  if (bVar2) {
    FUN_00409ed0(param_1);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffffffef;
  }
  return;
}
