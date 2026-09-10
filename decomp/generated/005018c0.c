/* Ghidra 12.1.3 pseudocode; entry 005018c0; add_unit_to_formation.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00501976) */
/* WARNING: Removing unreachable block (ram,0x00501980) */

void add_unit_to_formation(int param_1)

{
  byte bVar1;
  short sVar2;
  undefined4 uVar3;
  char cVar4;
  ushort uVar5;
  int iVar6;
  int iVar7;
  uint uVar8;
  int iVar9;
  short *psVar10;
  uint uVar11;
  int local_4;

  local_4 = 0;
  if ((*(byte *)(param_1 + 0x76) & 0x20) == 0) {
    if (*(char *)(param_1 + 0xab) == '\0') {
      if (((*(short *)(param_1 + 0x5f) != 0) && ((*(byte *)(param_1 + 0xd) & 8) == 0)) &&
         ('\x17' < *(char *)(param_1 + 0x65))) {
        *(undefined1 *)(param_1 + 0xab) = 0x18;
        cVar4 = find_formation_for_unit(param_1,&local_4);
        if (cVar4 == '\0') {
          iVar6 = FUN_00501c00(param_1);
          iVar7 = local_4;
          if ((iVar6 != 0) &&
             (iVar7 = alloc_unit(10,1,*(undefined1 *)(iVar6 + 0x2f),iVar6 + 0x3d), iVar7 != 0)) {
            uVar3 = *(undefined4 *)(iVar6 + 0x53);
            *(undefined4 *)(iVar7 + 0x57) = uVar3;
            uVar11 = (uint)(ushort)((short)uVar3 - *(short *)(iVar7 + 0x3d));
            uVar8 = (uint)(ushort)(*(short *)(iVar7 + 0x59) - *(short *)(iVar7 + 0x3f));
            if (0x7fff < uVar11) {
              uVar11 = uVar11 - 0x10000;
            }
            if (0x7fff < uVar8) {
              uVar8 = uVar8 - 0x10000;
            }
            uVar5 = calc_angle_quadrant(uVar11,-uVar8);
            *(ushort *)(iVar7 + 0x5d) = uVar5 & 0x7ff;
            *(undefined1 *)(iVar7 + 0x2d) = *(undefined1 *)(iVar6 + 0x2b);
            FUN_00501700(iVar7);
            sVar2 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(iVar6 + 0x30)].
                               field_0x4;
            *(short *)(iVar7 + 0x5f) =
                 (short)((int)((int)sVar2 + ((int)sVar2 >> 0x1f & 0xfU)) >> 4) + sVar2;
            if (*(byte *)(iVar7 + 0x69) < 0xb) {
              *(undefined2 *)(iVar7 + 0x6a + (uint)*(byte *)(iVar7 + 0x69) * 2) =
                   *(undefined2 *)(iVar6 + 0x24);
              iVar9 = 0;
              psVar10 = (short *)(iVar7 + 0x6a);
              *(char *)(iVar7 + 0x68) = *(char *)(iVar7 + 0x68) + '\x01';
              do {
                if (*psVar10 == 0) break;
                psVar10 = psVar10 + 1;
                iVar9 = iVar9 + 1;
              } while (iVar9 < 0xc);
              *(char *)(iVar7 + 0x69) = (char)iVar9;
              *(uint *)(iVar6 + 0xc) = *(uint *)(iVar6 + 0xc) | 0x200000;
              *(byte *)(iVar6 + 0x76) = *(byte *)(iVar6 + 0x76) | 0x20;
              *(short *)(iVar6 + 0x5f) = *(short *)(iVar7 + 0x5f) / 2;
            }
          }
          local_4 = iVar7;
          FUN_00501e90(local_4,iVar6,param_1);
          return;
        }
        bVar1 = *(byte *)(local_4 + 0x69);
        if (bVar1 < 0xb) {
          *(undefined2 *)(local_4 + 0x6a + (uint)bVar1 * 2) = *(undefined2 *)(param_1 + 0x24);
          iVar7 = 0;
          psVar10 = (short *)(local_4 + 0x6a);
          *(char *)(local_4 + 0x68) = *(char *)(local_4 + 0x68) + '\x01';
          do {
            if (*psVar10 == 0) break;
            psVar10 = psVar10 + 1;
            iVar7 = iVar7 + 1;
          } while (iVar7 < 0xc);
          *(byte *)(local_4 + 0x69) = (byte)iVar7;
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x200000;
          *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x20;
          *(short *)(param_1 + 0x5f) = *(short *)(local_4 + 0x5f) / 2;
          return;
        }
      }
    }
    else {
      *(char *)(param_1 + 0xab) = *(char *)(param_1 + 0xab) + -1;
    }
  }
  return;
}
