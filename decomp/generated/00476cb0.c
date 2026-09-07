/* Ghidra 12.1.3 pseudocode; entry 00476cb0; set_sprite_to_surface.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint set_sprite_to_surface(byte param_1,int *param_2)

{
  ushort uVar1;
  byte bVar2;
  uint uVar3;
  uint uVar4;
  uint uVar5;
  uint uVar6;
  int iVar7;
  ushort *puVar8;
  int iVar9;
  int iVar10;
  int unaff_ESI;
  byte *pbVar11;
  ushort *puVar12;
  ushort *puVar13;
  ushort *puVar14;
  ushort uVar15;
  undefined4 *puVar16;
  uint uVar17;
  bool bVar18;
  int *unaff_retaddr;
  int iVar19;
  int iStack_84;
  undefined4 local_6c [4];
  int iStack_5c;
  ushort uStack_1c;
  undefined4 *puStack_10;
  undefined4 uStack_c;
  int iStack_8;
  int iStack_4;

  puVar16 = local_6c;
  for (iVar7 = 0x1b; iVar7 != 0; iVar7 = iVar7 + -1) {
    *puVar16 = 0;
    puVar16 = puVar16 + 1;
  }
  local_6c[0] = 0x6c;
  iVar7 = *param_2;
  uVar3 = (**(code **)(iVar7 + 100))(param_2,0,local_6c,0x821,0);
  if (uVar3 == 0) {
    iVar10 = 1 << ((byte)param_2 & 0x1f);
    uVar3 = ((unaff_retaddr[2] - *unaff_retaddr) + iVar10) - 1U >> ((byte)param_2 & 0x1f);
    iVar19 = 0;
    pbVar11 = (byte *)*puStack_10;
    uVar4 = ((unaff_retaddr[3] - unaff_retaddr[1]) + iVar10) - 1U >> ((byte)param_2 & 0x1f);
    bVar2 = *pbVar11;
    if (*(short *)((int)puStack_10 + 6) != 0) {
      do {
        iVar9 = unaff_retaddr[1];
        uVar17 = -*unaff_retaddr;
        while (pbVar11 = pbVar11 + 1, bVar2 != 0) {
          if ((char)bVar2 < '\x01') {
            uVar5 = uVar17 - (int)(char)bVar2;
          }
          else {
            uVar5 = (int)(char)bVar2 + uVar17;
            uVar6 = ~(iVar10 - 1U) - uVar17 & (uVar17 + iVar10) - 1;
            pbVar11 = pbVar11 + uVar6;
            uVar17 = uVar17 + uVar6;
            do {
              bVar2 = *pbVar11;
              uVar6 = uVar17 + iVar10;
              pbVar11 = pbVar11 + iVar10;
              *(short *)((((iVar19 - iVar9 >> ((byte)param_2 & 0x1f)) + iStack_4) * (iVar7 / 2) +
                         iStack_8) * 2 + iStack_5c + (uVar17 >> ((byte)param_2 & 0x1f)) * 2) =
                   (short)*(undefined4 *)(unaff_ESI + (uint)bVar2 * 4);
              uVar17 = uVar6;
            } while (uVar6 < uVar5);
            pbVar11 = pbVar11 + (uVar5 - uVar6);
          }
          uVar17 = uVar5;
          bVar2 = *pbVar11;
        }
        iVar9 = iVar10 + -1;
        if (iVar9 != 0) {
          iVar19 = iVar19 + iVar9;
          do {
            bVar2 = *pbVar11;
            pbVar11 = pbVar11 + 1;
            if (bVar2 != 0) {
              bVar18 = bVar2 == 0;
              do {
                if (!bVar18 && -1 < (char)bVar2) {
                  pbVar11 = pbVar11 + (char)bVar2;
                }
                bVar2 = *pbVar11;
                pbVar11 = pbVar11 + 1;
                bVar18 = bVar2 == 0;
              } while (!bVar18);
            }
            iVar9 = iVar9 + -1;
          } while (iVar9 != 0);
        }
        bVar2 = *pbVar11;
        iVar19 = iVar19 + 1;
      } while (iVar19 < (int)(uint)*(ushort *)((int)puStack_10 + 6));
    }
    if ((param_1 & 1) != 0) {
      iVar7 = iVar7 / 2;
      puVar8 = (ushort *)((iStack_4 * iVar7 + iStack_8) * 2 + iStack_5c);
      uStack_1c = ~uStack_1c;
      puVar14 = puVar8;
      for (uVar17 = uVar4; uVar17 != 0; uVar17 = uVar17 - 1) {
        if (1 < uVar3) {
          iVar19 = uVar3 - 1;
          puVar12 = puVar14;
          uVar15 = *puVar14;
          do {
            puVar13 = puVar12 + 1;
            if ((puVar12[1] != 0) && (uVar15 == 0)) {
              *puVar12 = uStack_1c & puVar12[1];
            }
            uVar1 = *puVar13;
            if ((uVar1 == 0) && (uVar15 != 0)) {
              *puVar13 = uStack_1c & uVar15;
            }
            iVar19 = iVar19 + -1;
            puVar12 = puVar13;
            uVar15 = uVar1;
          } while (iVar19 != 0);
        }
        puVar14 = puVar14 + iVar7;
      }
      for (; uVar3 != 0; uVar3 = uVar3 - 1) {
        if (1 < uVar4) {
          iVar19 = uVar4 - 1;
          puVar14 = puVar8;
          uVar15 = *puVar8;
          do {
            puVar14 = puVar14 + iVar7;
            if ((*puVar14 != 0) && (uVar15 == 0)) {
              puVar14[-iVar7] = uStack_1c & *puVar14;
            }
            uVar1 = *puVar14;
            if ((uVar1 == 0) && (uVar15 != 0)) {
              *puVar14 = uVar15 & uStack_1c;
            }
            iVar19 = iVar19 + -1;
            uVar15 = uVar1;
          } while (iVar19 != 0);
        }
        puVar8 = puVar8 + 1;
      }
    }
    uVar3 = (**(code **)(iStack_84 + 0x80))(uStack_c,iStack_5c);
    uVar3 = (uVar3 == 0) - 1 & uVar3;
  }
  return uVar3;
}
