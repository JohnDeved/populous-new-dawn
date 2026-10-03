/* Ghidra 12.1.3 pseudocode; entry 004edf50; FUN_004edf50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004edf50(void)

{
  ushort *puVar1;
  int iVar2;
  ushort uVar3;
  int iVar4;
  byte *pbVar5;
  ushort *puVar6;
  undefined4 local_c;
  uint local_8;
  int local_4;

  local_8 = DAT_00890378;
  if (DAT_00890378 < DAT_00890384) {
    do {
      if ((*(char *)(local_8 + 0x2a) == '\x06') && (*(char *)(local_8 + 0x2b) == '\x06')) {
        local_4 = 10;
        puVar6 = (ushort *)(local_8 + 0x72);
        do {
          if (*puVar6 != 0) {
            iVar2 = (&DAT_00890390)[*puVar6];
            if ((*(uint *)(iVar2 + 0x10) & 0x20000000) != 0) {
              *(uint *)(iVar2 + 0x10) = *(uint *)(iVar2 + 0x10) & 0xdfffffff;
              if ((*(byte *)(iVar2 + 0xe) & 2) != 0) {
                uVar3 = CONCAT11((char)((ushort)*(undefined2 *)(iVar2 + 0x3f) >> 8),
                                 (char)((ushort)*(undefined2 *)(iVar2 + 0x3d) >> 8));
                local_c = (uint)uVar3 << 0x10;
                puVar1 = (ushort *)(iVar2 + 0x20);
                if (*(ushort *)(iVar2 + 0x22) == 0) {
                  (&DAT_008a03ea)[((uVar3 & 0xfe) * 2 | uVar3 & 0xfe00) * 2] = *puVar1;
                }
                else {
                  *(ushort *)((&DAT_00890390)[*(ushort *)(iVar2 + 0x22)] + 0x20) = *puVar1;
                }
                if (*puVar1 != 0) {
                  *(undefined2 *)((&DAT_00890390)[*puVar1] + 0x22) = *(undefined2 *)(iVar2 + 0x22);
                }
                *(uint *)(iVar2 + 0xc) = *(uint *)(iVar2 + 0xc) & 0xfffdffff;
              }
              if ((*(byte *)(iVar2 + 0xf) & 4) != 0) {
                iVar4 = 0;
                pbVar5 = &DAT_00937c46;
                do {
                  if ((*pbVar5 & *(short *)(pbVar5 + 10) == *(short *)(iVar2 + 0x24)) != 0) {
                    FUN_00401140(pbVar5);
                    break;
                  }
                  iVar4 = iVar4 + 1;
                  pbVar5 = pbVar5 + 0x3d;
                } while (iVar4 < 0x32);
              }
              if ((*(byte *)(iVar2 + 0xe) & 0x10) == 0) {
                *(undefined1 *)(iVar2 + 0x2c) = 0;
                switch(*(undefined1 *)(iVar2 + 0x2a)) {
                case 1:
                  FUN_004d2740(iVar2);
                  break;
                case 2:
                  FUN_004030c0(iVar2);
                  break;
                case 3:
                  FUN_00445c50(iVar2);
                  break;
                case 4:
                  FUN_00463370(iVar2);
                  break;
                case 5:
                  FUN_004a6210(iVar2);
                  break;
                case 6:
                  FUN_004fa7f0(iVar2);
                  break;
                case 7:
                  FUN_0050a740(iVar2);
                  break;
                case 8:
                  FUN_004bae20(iVar2);
                  break;
                case 9:
                  FUN_004b8150(iVar2);
                  break;
                case 10:
                  FUN_00500e20(iVar2);
                  break;
                case 0xb:
                  FUN_004c1930(iVar2);
                }
              }
              if (*(char *)(iVar2 + 0x2a) == '\x02') {
                FUN_00403860(iVar2);
              }
              local_c = CONCAT31(local_c._1_3_,(char)((ushort)*(undefined2 *)(iVar2 + 0x3d) >> 8)) &
                        0xfffffffe;
              local_c = CONCAT22(local_c._2_2_,
                                 CONCAT11((char)((ushort)*(undefined2 *)(iVar2 + 0x3f) >> 8),
                                          (undefined1)local_c)) & 0xfffffeff;
              FUN_0044fad0(local_c);
            }
          }
          puVar6 = puVar6 + 1;
          local_4 = local_4 + -1;
        } while (local_4 != 0);
      }
      local_8 = local_8 + 0xb3;
    } while (local_8 < DAT_00890384);
  }
  return;
}
