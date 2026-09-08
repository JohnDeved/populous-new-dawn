/* Ghidra 12.1.3 pseudocode; entry 004a2960; FUN_004a2960.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004a2df0) */
/* WARNING: Removing unreachable block (ram,0x004a2ca8) */
/* WARNING: Removing unreachable block (ram,0x004a2c62) */
/* WARNING: Removing unreachable block (ram,0x004a2c85) */
/* WARNING: Removing unreachable block (ram,0x004a2dcd) */
/* WARNING: Removing unreachable block (ram,0x004a2e13) */
/* WARNING: Removing unreachable block (ram,0x004a2dfa) */
/* WARNING: Removing unreachable block (ram,0x004a2cb2) */
/* WARNING: Removing unreachable block (ram,0x004a2c6c) */
/* WARNING: Removing unreachable block (ram,0x004a2c8f) */
/* WARNING: Removing unreachable block (ram,0x004a2a26) */
/* WARNING: Removing unreachable block (ram,0x004a2a02) */
/* WARNING: Removing unreachable block (ram,0x004a2a4a) */
/* WARNING: Removing unreachable block (ram,0x004a2dd7) */
/* WARNING: Removing unreachable block (ram,0x004a2e1d) */

void FUN_004a2960(void)

{
  undefined *puVar1;
  bool bVar2;
  int iVar3;
  uint uVar4;
  undefined4 *puVar5;
  byte bVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  byte *pbVar11;
  byte *pbVar12;
  int local_18;

  local_18 = 0x10;
  if (((DAT_0098df98 != '\0') && (DAT_0089d163 != '\0')) && (((byte)land_flags_1 & 2) == 0)) {
    level_flags_1 = level_flags_1 | 1;
    DAT_0098df9b = DAT_0098df9b - 1;
    if ((char)DAT_0098df9b < '\x01') {
      DAT_0098df9a = DAT_0098df9a + '\x01';
      DAT_0098df9b = (&DAT_0098df9d)[DAT_0098df9a * 4];
    }
    switch((&DAT_0098df9c)[DAT_0098df9a * 4]) {
    case 1:
      puVar5 = pal0_mem_2;
      iVar7 = 0x1c0;
      do {
        uVar4 = *(byte *)puVar5 + 0x77;
        if (0xff < uVar4) {
          uVar4 = 0xff;
        }
        *(char *)((int)pal0_mem + iVar7) = (char)uVar4;
        uVar4 = *(byte *)((int)puVar5 + 1) + 0x77;
        if (0xff < uVar4) {
          uVar4 = 0xff;
        }
        *(char *)((int)pal0_mem + iVar7 + 1) = (char)uVar4;
        iVar9 = iVar7 + 2;
        uVar4 = *(byte *)((int)puVar5 + 2) + 0x77;
        if (0xff < uVar4) {
          uVar4 = 0xff;
        }
        puVar5 = (undefined4 *)((int)puVar5 + 4);
        iVar7 = iVar7 + 4;
        *(char *)((int)pal0_mem + iVar9) = (char)uVar4;
      } while (puVar5 < &DAT_00899fcd);
      break;
    case 2:
      uVar4 = pseudo_random * 0x24a1 + 0x24df;
      pseudo_random = uVar4 >> 0xd | uVar4 * 0x80000;
      puVar5 = pal0_mem_2;
      iVar9 = 0x1c0;
      iVar7 = (-0x78 - pseudo_random % 0x28) * 0xff;
      iVar7 = (int)(iVar7 + (iVar7 >> 0x1f & 0xffU)) >> 8;
      do {
        iVar8 = (uint)*(byte *)puVar5 + iVar7;
        if (iVar8 < 0) {
          iVar8 = 0;
        }
        if (0xff < iVar8) {
          iVar8 = 0xff;
        }
        *(char *)((int)pal0_mem + iVar9) = (char)iVar8;
        iVar8 = (uint)*(byte *)((int)puVar5 + 1) + iVar7;
        if (iVar8 < 0) {
          iVar8 = 0;
        }
        if (0xff < iVar8) {
          iVar8 = 0xff;
        }
        *(char *)((int)pal0_mem + iVar9 + 1) = (char)iVar8;
        iVar8 = iVar9 + 2;
        iVar10 = (uint)*(byte *)((int)puVar5 + 2) + iVar7;
        if (iVar10 < 0) {
          iVar10 = 0;
        }
        if (0xff < iVar10) {
          iVar10 = 0xff;
        }
        puVar5 = (undefined4 *)((int)puVar5 + 4);
        iVar9 = iVar9 + 4;
        *(char *)((int)pal0_mem + iVar8) = (char)iVar10;
      } while (puVar5 < &DAT_00899fcd);
      break;
    case 3:
    case 4:
      bVar2 = true;
      if (((&DAT_0098df9c)[DAT_0098df9a * 4] == '\x03') && ((DAT_0098df9b & 2) != 0)) {
        bVar2 = false;
      }
      bVar6 = 0;
      if (bVar2) {
        iVar9 = 0;
        iVar7 = 0;
        switch(DAT_0089d165) {
        case 0:
          bVar6 = 0xff;
          break;
        case 1:
          iVar7 = 0xff;
          break;
        case 2:
          iVar7 = 0xff;
          iVar9 = 0xff;
          break;
        case 3:
          iVar9 = 0xff;
        }
        iVar8 = 0x1c0;
        iVar10 = 0x10;
        do {
          uVar4 = (uint)*(byte *)((int)pal0_mem + iVar8);
          iVar3 = (int)(iVar7 - uVar4) / 2 + uVar4;
          if (iVar3 < 0) {
            iVar3 = 0;
          }
          if (0xff < iVar3) {
            iVar3 = 0xff;
          }
          *(byte *)((int)pal0_mem + iVar8) = (byte)iVar3;
          pbVar11 = (byte *)((int)pal0_mem + iVar8 + 1);
          uVar4 = (uint)*pbVar11;
          iVar3 = (int)(iVar9 - uVar4) / 2 + uVar4;
          if (iVar3 < 0) {
            iVar3 = 0;
          }
          if (0xff < iVar3) {
            iVar3 = 0xff;
          }
          *pbVar11 = (byte)iVar3;
          pbVar11 = (byte *)((int)pal0_mem + iVar8 + 2);
          uVar4 = (uint)*pbVar11;
          iVar3 = (int)(bVar6 - uVar4) / 2 + uVar4;
          if (iVar3 < 0) {
            iVar3 = 0;
          }
          if (0xff < iVar3) {
            iVar3 = 0xff;
          }
          iVar8 = iVar8 + 4;
          *pbVar11 = (byte)iVar3;
          iVar10 = iVar10 + -1;
        } while (iVar10 != 0);
      }
      else {
        puVar5 = pal0_mem_2;
        iVar7 = 0x1c0;
        do {
          *(undefined1 *)((int)pal0_mem + iVar7) = *(undefined1 *)puVar5;
          *(undefined *)((int)pal0_mem + iVar7 + 1) = *(undefined *)((int)puVar5 + 1);
          iVar9 = iVar7 + 2;
          puVar1 = (undefined *)((int)puVar5 + 2);
          puVar5 = puVar5 + 1;
          iVar7 = iVar7 + 4;
          *(undefined *)((int)pal0_mem + iVar9) = *puVar1;
        } while (puVar5 < &DAT_00899fcd);
      }
      break;
    case 5:
      puVar5 = pal0_mem_2;
      iVar7 = 0x1c0;
      do {
        if ((char)DAT_0098df9b == 0) {
          uVar4 = (uint)*(byte *)puVar5;
        }
        else {
          uVar4 = (uint)*(byte *)((int)pal0_mem + iVar7);
          uVar4 = (int)(*(byte *)puVar5 - uVar4) / (int)(char)DAT_0098df9b + uVar4;
        }
        if ((int)uVar4 < 0) {
          uVar4 = 0;
        }
        if (0xff < (int)uVar4) {
          uVar4 = 0xff;
        }
        *(byte *)((int)pal0_mem + iVar7) = (byte)uVar4;
        pbVar11 = (byte *)((int)pal0_mem + iVar7 + 1);
        if ((char)DAT_0098df9b == 0) {
          uVar4 = (uint)*(byte *)((int)puVar5 + 1);
        }
        else {
          uVar4 = (uint)*pbVar11;
          uVar4 = (int)(*(byte *)((int)puVar5 + 1) - uVar4) / (int)(char)DAT_0098df9b + uVar4;
        }
        if ((int)uVar4 < 0) {
          uVar4 = 0;
        }
        if (0xff < (int)uVar4) {
          uVar4 = 0xff;
        }
        *pbVar11 = (byte)uVar4;
        pbVar11 = (byte *)((int)pal0_mem + iVar7 + 2);
        if ((char)DAT_0098df9b == 0) {
          uVar4 = (uint)*(byte *)((int)puVar5 + 2);
        }
        else {
          uVar4 = (uint)*pbVar11;
          uVar4 = (int)(*(byte *)((int)puVar5 + 2) - uVar4) / (int)(char)DAT_0098df9b + uVar4;
        }
        if ((int)uVar4 < 0) {
          uVar4 = 0;
        }
        if (0xff < (int)uVar4) {
          uVar4 = 0xff;
        }
        puVar5 = (undefined4 *)((int)puVar5 + 4);
        iVar7 = iVar7 + 4;
        *pbVar11 = (byte)uVar4;
      } while (puVar5 < &DAT_00899fcd);
      break;
    case 6:
      puVar5 = pal0_mem_2;
      iVar7 = 0x1c0;
      DAT_0098df98 = '\0';
      do {
        *(undefined1 *)((int)pal0_mem + iVar7) = *(undefined1 *)puVar5;
        *(undefined *)((int)pal0_mem + iVar7 + 1) = *(undefined *)((int)puVar5 + 1);
        iVar9 = iVar7 + 2;
        puVar1 = (undefined *)((int)puVar5 + 2);
        puVar5 = puVar5 + 1;
        iVar7 = iVar7 + 4;
        *(undefined *)((int)pal0_mem + iVar9) = *puVar1;
      } while (puVar5 < &DAT_00899fcd);
      break;
    case 10:
      DAT_005ddc9c = 1;
      DAT_005ddca0 = 0x3200;
      break;
    case 0xb:
      uVar4 = pseudo_random * 0x24a1 + 0x24df;
      pseudo_random = uVar4 >> 0xd | uVar4 * 0x80000;
      DAT_005ddc9c = 1;
      DAT_005ddca0 = (0x20 - pseudo_random % 0x18) * 0x100;
      break;
    case 0xc:
      DAT_005ddc9c = 1;
      DAT_005ddca0 = (int)((int)((DAT_005ddca0 & 0xffffff00) * -0x100 + 0x200000) /
                           (int)(char)DAT_0098df9b + (DAT_005ddca0 & 0xffffff00) * 0x100 &
                          0xffff00ff) >> 8;
      break;
    case 0xd:
      DAT_0098df98 = '\0';
      DAT_005ddc9c = 0;
    }
  }
  if (((byte)level_flags & 4) != 0) {
    if (DAT_0087ca50 < 0x33) {
      local_18 = (DAT_0087ca50 << 4) / 0x32;
    }
    if (pal0_mem_2_size != local_18) {
      pal0_mem_2_size = (char)local_18;
      level_flags_1 = level_flags_1 | 1;
      iVar7 = 0x1c0;
      pbVar11 = (byte *)pal0_mem_2;
      do {
        pbVar12 = pbVar11 + 4;
        *(char *)((int)pal0_mem + iVar7) =
             (char)((int)((uint)*pbVar11 * (int)pal0_mem_2_size +
                         ((int)((uint)*pbVar11 * (int)pal0_mem_2_size) >> 0x1f & 0xfU)) >> 4);
        *(char *)((int)pal0_mem + iVar7 + 1) =
             (char)((int)((uint)pbVar11[1] * (int)pal0_mem_2_size +
                         ((int)((uint)pbVar11[1] * (int)pal0_mem_2_size) >> 0x1f & 0xfU)) >> 4);
        *(char *)((int)pal0_mem + iVar7 + 2) =
             (char)((int)((uint)pbVar11[2] * (int)pal0_mem_2_size +
                         ((int)((uint)pbVar11[2] * (int)pal0_mem_2_size) >> 0x1f & 0xfU)) >> 4);
        iVar7 = iVar7 + 4;
        pbVar11 = pbVar12;
      } while (pbVar12 < &DAT_00899fcd);
    }
  }
  return;
}
