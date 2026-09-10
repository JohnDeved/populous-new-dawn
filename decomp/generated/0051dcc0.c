/* Ghidra 12.1.3 pseudocode; entry 0051dcc0; FUN_0051dcc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0051dcc0(int param_1,int param_2)

{
  char cVar1;
  byte bVar2;
  char cVar3;
  ushort uVar4;
  int iVar5;
  int iVar6;
  ushort *puVar7;
  byte abStack_4 [4];

  iVar5 = 0;
  cVar1 = *(char *)(param_2 + 0x2f);
  if ((*(char *)(param_1 + 0x69) == cVar1) || (*(char *)(param_1 + 0x6a) == cVar1)) {
    bVar2 = *(byte *)(param_2 + 0x2b);
    if ((unit_type_array_person[bVar2].flags & 0x40) == 0) {
      cVar3 = *(char *)(param_1 + 0x6a);
      abStack_4[*(char *)(param_1 + 0x69)] = 0;
      puVar7 = (ushort *)(param_1 + 0x70);
      abStack_4[cVar3] = 0;
      iVar6 = 6;
      do {
        if (*puVar7 != 0) {
          abStack_4[(char)unit_land_array[*puVar7]->tribe_index] =
               abStack_4[(char)unit_land_array[*puVar7]->tribe_index] + 1;
        }
        puVar7 = puVar7 + 1;
        iVar6 = iVar6 + -1;
      } while (iVar6 != 0);
      if (abStack_4[cVar1] < 3) {
        iVar6 = 0;
        do {
          if ((char)iVar5 != '\0') {
            return iVar5;
          }
          if (*(short *)(param_1 + 0x70 + iVar6 * 2) == 0) {
            iVar5 = iVar6 + 1;
          }
          iVar6 = iVar6 + 1;
        } while (iVar6 < 6);
      }
      if ((char)iVar5 == '\0') {
        iVar6 = 0;
        while ((char)iVar5 == '\0') {
          uVar4 = *(ushort *)(param_1 + 0x70 + iVar6 * 2);
          if (((uVar4 != 0) && (unit_land_array[uVar4]->tribe_index == cVar1)) &&
             ((byte)unit_type_array_person[(byte)unit_land_array[uVar4]->unit_type].field_0x17 <
              (byte)unit_type_array_person[bVar2].field_0x17)) {
            iVar5 = iVar6 + 1;
          }
          iVar6 = iVar6 + 1;
          if (5 < iVar6) {
            return iVar5;
          }
        }
      }
    }
    else {
      iVar5 = 0xff;
    }
  }
  return iVar5;
}
