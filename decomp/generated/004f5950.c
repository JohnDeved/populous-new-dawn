/* Ghidra 12.1.3 pseudocode; entry 004f5950; FUN_004f5950.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f5950(int param_1,uint param_2,uint *param_3,uint *param_4,int param_5,int param_6)

{
  byte bVar1;
  int iVar2;
  byte bVar3;
  ushort uVar4;
  int iVar5;
  int iVar6;
  uint *puVar7;
  uint *puVar8;
  int local_14;
  int local_10;
  int local_c;
  int local_8;

  local_c = 0;
  local_14 = 0;
  local_10 = 0;
  puVar8 = param_4;
  puVar7 = param_3;
  for (iVar2 = (&DAT_00890390)
               [(short)(&DAT_008a03ea)[((param_2 & 0xfe) * 2 | param_2 & 0xfe00) * 2]]; iVar2 != 0;
      iVar2 = (&DAT_00890390)[*(ushort *)(iVar2 + 0x20)]) {
    if (*(char *)(iVar2 + 0x2a) == '\x01') {
      if ((((((*(byte *)(iVar2 + 0xe) & 1) == 0) && (*(char *)(iVar2 + 0x2b) != '\x01')) &&
           (*(char *)(iVar2 + 0x2b) != '\b')) &&
          ((*(char *)(iVar2 + 0x2c) != '\x17' && ((*(byte *)(iVar2 + 0x11) & 0x10) == 0)))) &&
         (iVar5 = FUN_004de7b0(iVar2,(int)*(char *)(param_1 + 0xc22)), iVar5 == 0)) {
        bVar3 = *(byte *)(param_1 + 0xc22);
        if (((bVar3 == 0xff) || (bVar1 = *(byte *)(iVar2 + 0x2f), bVar1 == 0xff)) ||
           (bVar3 == bVar1)) {
          bVar3 = 1;
        }
        else {
          bVar3 = *(byte *)((int)&DAT_009608b6 + (int)(char)bVar3) & '\x01' << (bVar1 & 0x1f);
        }
        if ((bVar3 == 0) && (local_10 < param_5)) {
          local_10 = local_10 + 1;
          *puVar8 = (uint)*(ushort *)(iVar2 + 0x24);
          puVar8 = puVar8 + 1;
        }
      }
    }
    else if (*(char *)(iVar2 + 0x2a) == '\x02') {
      bVar3 = *(byte *)(param_1 + 0xc22);
      if (((bVar3 == 0xff) || (bVar1 = *(byte *)(iVar2 + 0x2f), bVar1 == 0xff)) || (bVar3 == bVar1))
      {
        bVar3 = 1;
      }
      else {
        bVar3 = *(byte *)((int)&DAT_009608b6 + (int)(char)bVar3) & '\x01' << (bVar1 & 0x1f);
      }
      if ((bVar3 == 0) && (local_14 < param_5)) {
        local_14 = local_14 + 1;
        *puVar7 = (uint)*(ushort *)(iVar2 + 0x24);
        puVar7 = puVar7 + 1;
      }
    }
  }
  local_8 = 0;
  iVar2 = (param_6 + 1) * param_6 * 4 + -1;
  if (0 < iVar2) {
    do {
      uVar4 = FUN_0049c890(param_2,local_c,0);
      local_c = local_c + 1;
      iVar5 = (&DAT_00890390)[(short)(&DAT_008a03ea)[((uVar4 & 0xfe) * 2 | uVar4 & 0xfe00) * 2]];
      if (iVar5 != 0) {
        puVar8 = param_3 + local_14;
        puVar7 = param_4 + local_10;
        do {
          if (*(char *)(iVar5 + 0x2a) == '\x01') {
            if ((((*(byte *)(iVar5 + 0xe) & 1) == 0) && (*(char *)(iVar5 + 0x2b) != '\x01')) &&
               ((*(char *)(iVar5 + 0x2b) != '\b' &&
                (((*(char *)(iVar5 + 0x2c) != '\x17' && ((*(byte *)(iVar5 + 0x11) & 0x10) == 0)) &&
                 (iVar6 = FUN_004de7b0(iVar5,(int)*(char *)(param_1 + 0xc22)), iVar6 == 0)))))) {
              bVar3 = *(byte *)(param_1 + 0xc22);
              if (((bVar3 == 0xff) || (bVar1 = *(byte *)(iVar5 + 0x2f), bVar1 == 0xff)) ||
                 (bVar3 == bVar1)) {
                bVar3 = 1;
              }
              else {
                bVar3 = *(byte *)((int)&DAT_009608b6 + (int)(char)bVar3) & '\x01' << (bVar1 & 0x1f);
              }
              if ((bVar3 == 0) && (local_10 < param_5)) {
                local_10 = local_10 + 1;
                *puVar7 = (uint)*(ushort *)(iVar5 + 0x24);
                puVar7 = puVar7 + 1;
              }
            }
          }
          else if (*(char *)(iVar5 + 0x2a) == '\x02') {
            bVar3 = *(byte *)(param_1 + 0xc22);
            if (((bVar3 == 0xff) || (bVar1 = *(byte *)(iVar5 + 0x2f), bVar1 == 0xff)) ||
               (bVar3 == bVar1)) {
              bVar3 = 1;
            }
            else {
              bVar3 = *(byte *)((int)&DAT_009608b6 + (int)(char)bVar3) & '\x01' << (bVar1 & 0x1f);
            }
            if ((bVar3 == 0) && (local_14 < param_5)) {
              local_14 = local_14 + 1;
              *puVar8 = (uint)*(ushort *)(iVar5 + 0x24);
              puVar8 = puVar8 + 1;
            }
          }
          iVar5 = (&DAT_00890390)[*(ushort *)(iVar5 + 0x20)];
        } while (iVar5 != 0);
      }
    } while (((local_14 < param_5) || (local_10 < param_5)) &&
            (local_8 = local_8 + 1, local_8 < iVar2));
  }
  return;
}
