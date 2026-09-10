/* Ghidra 12.1.3 pseudocode; entry 00504920; FUN_00504920.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00504920(void)

{
  unit_struct *puVar1;
  char cVar2;
  uint uVar3;
  uint uVar4;
  unit_struct *puVar5;
  int iVar6;
  char *pcVar7;
  uint local_14;
  int local_10;
  undefined1 local_8 [8];

  if (DAT_00895fad != 0) {
    pcVar7 = &DAT_00895fb9;
    uVar3 = (uint)DAT_00895fad;
    local_14 = 0;
    local_10 = 0;
    if (uVar3 != 0) {
      do {
        if (*pcVar7 != '\0') {
          local_10 = local_10 + 1;
          puVar5 = unit_land_array[*(ushort *)(pcVar7 + 10)];
          puVar1 = unit_land_array[*(ushort *)(pcVar7 + 0xc)];
          FUN_005090f0(pcVar7,puVar5,puVar1,local_8);
          add_unit_to_cell(puVar5,local_8);
          if ((pcVar7[2] != '\0') && (pcVar7[1] == '\x01')) {
            cVar2 = FUN_005092e0(puVar1);
            if (cVar2 == '\0') {
              pcVar7[6] = '\0';
              pcVar7[7] = '\0';
              puVar1->flags_3 = puVar1->flags_3 & 0xff7fffff;
            }
            else {
              puVar1->flags_3 = puVar1->flags_3 | 0x800000;
              *(undefined2 *)(pcVar7 + 6) = *(undefined2 *)(pcVar7 + 0x1c);
            }
          }
          if (*(short *)(pcVar7 + 6) == 0) {
            cVar2 = pcVar7[1];
            if (((-1 < cVar2) && (pcVar7[cVar2 * 4 + 0x16] == '\x01')) &&
               (*(short *)(pcVar7 + 0x22) != 0)) {
              FUN_00508ee0(CONCAT22(cVar2 >> 7,*(short *)(pcVar7 + 0x22)));
              pcVar7[0x22] = '\0';
              pcVar7[0x23] = '\0';
            }
            cVar2 = pcVar7[1] + '\x01';
            pcVar7[1] = cVar2;
            if (cVar2 < '\x03') {
              *(undefined2 *)(pcVar7 + 6) = *(undefined2 *)(pcVar7 + cVar2 * 4 + 0x18);
              cVar2 = pcVar7[1];
              iVar6 = (int)cVar2;
              if (pcVar7[iVar6 * 4 + 0x16] == '\x01') {
                cVar2 = FUN_00507900(pcVar7 + 0x22,pcVar7[iVar6 * 4 + 0x17],
                                     CONCAT11((char)((ushort)*(undefined2 *)
                                                              (pcVar7 + iVar6 * 4 + 0x18) >> 8),
                                              cVar2 == '\0'),
                                     CONCAT22((short)((uint)puVar5 >> 0x10),
                                              *(undefined2 *)(pcVar7 + 0x12)),
                                     CONCAT22(cVar2 >> 7,*(undefined2 *)(pcVar7 + 0x14)),
                                     *(undefined2 *)(pcVar7 + iVar6 * 4 + 0x18));
                if (cVar2 == '\0') {
                  pcVar7[pcVar7[1] * 4 + 0x16] = '\0';
                }
              }
            }
            else {
              uVar4 = local_14 & 0xff;
              cVar2 = (&DAT_00895fba)[uVar4 * 0x9e];
              if (((-1 < cVar2) && (cVar2 < '\x03')) &&
                 (((&DAT_00895fcf)[cVar2 * 4 + uVar4 * 0x9e] == '\x01' &&
                  ((&DAT_00895fdb)[uVar4 * 0x4f] != 0)))) {
                FUN_00508ee0(CONCAT22(cVar2 >> 7,(&DAT_00895fdb)[uVar4 * 0x4f]));
                (&DAT_00895fdb)[uVar4 * 0x4f] = 0;
              }
              puVar5 = (unit_struct *)0x0;
              if ((((&DAT_00895fc5)[uVar4 * 0x4f] != 0) &&
                  (puVar1 = unit_land_array[(ushort)(&DAT_00895fc5)[uVar4 * 0x4f]],
                  (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
                puVar5 = puVar1;
              }
              if (puVar5 != (unit_struct *)0x0) {
                puVar5->flags_3 = puVar5->flags_3 & 0xff7fffff;
              }
              puVar5 = (unit_struct *)0x0;
              (&DAT_00895fb9)[uVar4 * 0x9e] = 0;
              (&DAT_00895fbf)[uVar4 * 0x4f] = 0;
              (&DAT_00895fc5)[uVar4 * 0x4f] = 0;
              DAT_00895fad = DAT_00895fad - 1;
              if ((((&DAT_00895fc3)[uVar4 * 0x4f] != 0) &&
                  (puVar1 = unit_land_array[(ushort)(&DAT_00895fc3)[uVar4 * 0x4f]],
                  (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
                puVar5 = puVar1;
              }
              if (puVar5 != (unit_struct *)0x0) {
                FUN_004ef180(puVar5);
              }
            }
          }
          if ((*(short *)(pcVar7 + 6) != 0) &&
             (*(short *)(pcVar7 + 6) = *(short *)(pcVar7 + 6) + -1,
             pcVar7[pcVar7[1] * 4 + 0x16] == '\x01')) {
            FUN_005079b0(pcVar7 + 0x22);
          }
        }
        pcVar7 = pcVar7 + 0x9e;
        local_14 = local_14 + 1;
      } while (local_10 < (int)uVar3);
    }
  }
  return;
}
