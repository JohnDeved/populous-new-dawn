/* Ghidra 12.1.3 pseudocode; entry 0048ad50; FUN_0048ad50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0048ad50(int *param_1)

{
  ushort uVar1;
  unit_struct *puVar2;
  bool bVar3;
  int *piVar4;
  unit_struct *puVar5;

  bVar3 = false;
  uVar1 = *(ushort *)(param_1 + 3);
  piVar4 = DAT_0089ce6d;
  if (uVar1 != 0) {
    for (; piVar4 != (int *)0x0; piVar4 = (int *)*piVar4) {
      if ((piVar4 != param_1) && (*(ushort *)(piVar4 + 3) == uVar1)) {
        bVar3 = true;
        break;
      }
    }
    if (!bVar3) {
      puVar5 = (unit_struct *)0x0;
      if (((uVar1 != 0) && (puVar2 = unit_land_array[uVar1], (*(byte *)&puVar2->flags_2 & 1) == 0))
         && (puVar2->unit_class != '\0')) {
        puVar5 = puVar2;
      }
      if (puVar5 != (unit_struct *)0x0) {
        puVar5->flags_4 = puVar5->flags_4 & 0xffffffef;
      }
    }
  }
  (&DAT_005acf69)[(uint)*(ushort *)(param_1 + 4) * 0xc] =
       (&DAT_005acf69)[(uint)*(ushort *)(param_1 + 4) * 0xc] + -1;
  if ((int *)param_1[1] == (int *)0x0) {
    DAT_0089ce6d = (int *)*param_1;
  }
  else {
    *(int *)param_1[1] = *param_1;
  }
  if (*param_1 != 0) {
    *(int *)(*param_1 + 4) = param_1[1];
  }
  if (param_1[7] != 0) {
    free_2(param_1[7]);
    param_1[7] = 0;
  }
  free_2(param_1);
  _DAT_005ae29c = _DAT_005ae29c + 1;
  return;
}
