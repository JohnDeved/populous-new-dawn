/* Ghidra 12.1.3 pseudocode; entry 004514f0; FUN_004514f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004514f0(int param_1,int param_2,uint param_3,ushort *param_4,char param_5)

{
  undefined *puVar1;
  bool bVar2;
  int iVar3;
  int iVar4;
  ushort *puVar5;
  undefined *puVar6;
  int local_18;
  int local_14;
  short local_c;
  short local_a;
  short local_8;
  short local_6;
  int local_4;

  puVar6 = &DAT_0089d1c8 + param_1 * 0xc65;
  local_18 = 0;
  local_14 = 0;
  local_8 = (*param_4 & 0xfe00) + 0x100;
  local_6 = (param_4[1] & 0xfe00) + 0x100;
  do {
    if (local_14 != 0) {
      return local_14;
    }
    local_4 = 0xfffffff;
    iVar3 = DAT_00890368;
    if (((&DAT_005a794d)[param_2 * 0x17] & 1) != 0) {
      iVar3 = DAT_00890364;
    }
    for (; iVar3 != 0; iVar3 = *(int *)(iVar3 + 8)) {
      if ((*(char *)(iVar3 + 0x2f) == param_1) && (*(char *)(iVar3 + 0x9e) != '\0')) {
        bVar2 = false;
        if ((*(char *)(iVar3 + 0x2b) == '\a') ||
           ((*(uint *)((int)&DAT_0089db05 + param_1 * 0xc65) & 0x80) == 0)) {
LAB_00451602:
          bVar2 = true;
        }
        else {
          local_c = (*param_4 & 0xfe00) + 0x100;
          local_a = (param_4[1] & 0xfe00) + 0x100;
          iVar4 = FUN_00450450(iVar3 + 0x3d,&local_c);
          if (iVar4 < 0x2400000) goto LAB_00451602;
        }
        if (bVar2) {
          bVar2 = true;
          if (local_18 == 0) {
            puVar6 = (undefined *)0x0;
            if (((*(ushort *)(iVar3 + 0x7a) != 0) &&
                (puVar1 = (undefined *)(&DAT_00890390)[*(ushort *)(iVar3 + 0x7a)],
                (*(uint *)(puVar1 + 0xc) & 1) == 0)) && (puVar1[0x2a] != '\0')) {
              puVar6 = puVar1;
            }
            if ((puVar6 != (undefined *)0x0) && (puVar6[0xa7] != '\0')) {
              bVar2 = false;
            }
          }
          if (bVar2) {
            iVar4 = 0;
            bVar2 = false;
            if (0 < (char)(&DAT_005a7940)[(uint)*(byte *)(iVar3 + 0x2b) * 0x17]) {
              puVar5 = (ushort *)(iVar3 + 0x7a);
              do {
                if (bVar2) goto LAB_004516d2;
                puVar6 = (undefined *)0x0;
                if (((*puVar5 != 0) &&
                    (puVar1 = (undefined *)(&DAT_00890390)[*puVar5], (puVar1[0xc] & 1) == 0)) &&
                   (puVar1[0x2a] != '\0')) {
                  puVar6 = puVar1;
                }
                if (((puVar6 != (undefined *)0x0) &&
                    (((byte)puVar6[0x2b] == param_3 || (param_3 == 0)))) &&
                   ((param_5 != '\0' ||
                    (((puVar6[0x10] & 0x80) == 0 && ((puVar6[0x7a] & 0x80) == 0)))))) {
                  bVar2 = true;
                }
                puVar5 = puVar5 + 1;
                iVar4 = iVar4 + 1;
              } while (iVar4 < (char)(&DAT_005a7940)[(uint)*(byte *)(iVar3 + 0x2b) * 0x17]);
            }
            if (bVar2) {
LAB_004516d2:
              iVar4 = FUN_004503f0(&local_8,puVar6 + 0x3d);
              if (iVar4 < local_4) {
                local_14 = iVar3;
                local_4 = iVar4;
              }
            }
          }
        }
      }
    }
    local_18 = local_18 + 1;
    if (1 < local_18) {
      return local_14;
    }
  } while( true );
}
