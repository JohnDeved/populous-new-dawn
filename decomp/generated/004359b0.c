/* Ghidra 12.1.3 pseudocode; entry 004359b0; FUN_004359b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004359b0(int param_1,uint param_2,uint param_3,uint param_4)

{
  bool bVar1;
  uint uVar2;
  uint uVar3;
  char cVar4;
  int iVar5;
  int iVar6;
  byte bVar7;
  uint *puVar8;
  undefined1 *puVar9;
  int iVar10;
  byte *pbVar11;
  undefined4 *puVar12;
  int local_34;
  int local_2c;
  uint *local_24;
  uint local_20 [8];

  iVar10 = 0;
  local_2c = 1;
  iVar5 = (int)*(char *)(param_1 + 0x8bf);
  if (0 < iVar5) {
    puVar8 = local_20;
    do {
      if (local_2c == 0) break;
      bVar1 = false;
      iVar6 = 0;
      uVar3 = 0;
      puVar9 = (undefined1 *)
               ((int)(game_state.sunlight_array + 0x32) + (short)game_state._841984_2_ * 10);
      do {
        if (&game_state.field_0x9d5f7 < puVar9) {
          puVar9 = &game_state.field_0x9b6c2;
        }
        if (*(short *)(puVar9 + 2) == 0) {
          bVar1 = true;
          break;
        }
        iVar6 = iVar6 + 1;
        puVar9 = puVar9 + 10;
      } while (iVar6 < 800);
      if (bVar1) {
        puVar9[1] = 0;
        *puVar9 = 0;
        uVar3 = (int)(puVar9 + -0x938830) / 10;
        *(undefined2 *)(puVar9 + 4) = 0;
        game_state._841984_2_ = (short)uVar3 + 1;
        if (799 < (short)game_state._841984_2_) {
          game_state._841984_2_ = 1;
        }
      }
      *puVar8 = uVar3 & 0xffff;
      if ((uVar3 & 0xffff) == 0) {
        local_2c = 0;
      }
      puVar8 = puVar8 + 1;
      iVar10 = iVar10 + 1;
    } while (iVar10 < iVar5);
  }
  if (local_2c != 0) {
    for (iVar10 = *(int *)(param_1 + 0x881); iVar10 != 0; iVar10 = *(int *)(iVar10 + 8)) {
      if (((*(byte *)(iVar10 + 0x7a) & 0x80) != 0) &&
         ((((param_2 == 0xffffffff || (uVar3 = (uint)*(byte *)(iVar10 + 0x2b), param_2 == uVar3)) ||
           (param_3 == uVar3)) || (param_4 == uVar3)))) {
        iVar6 = 0;
        *(undefined1 *)(iVar10 + 0xa6) = 0;
        do {
          if (*(short *)(iVar10 + 0x8b + iVar6 * 2) != 0) {
            FUN_004364d0(iVar10,iVar6);
          }
          iVar6 = iVar6 + 1;
        } while (iVar6 < 8);
        if (*(short *)(iVar10 + 0x9b) != 0) {
          FUN_004364d0(iVar10,0xffffffff);
        }
        *(uint *)(iVar10 + 0xc) = *(uint *)(iVar10 + 0xc) & 0xf7ffffff;
        *(uint *)(iVar10 + 0x10) = *(uint *)(iVar10 + 0x10) & 0xfffffdff;
        pbVar11 = (byte *)(param_1 + 0x8c1);
        bVar7 = *(byte *)(iVar10 + 0xa6);
        if (0 < iVar5) {
          local_24 = local_20;
          local_34 = iVar5;
          do {
            if ((pbVar11[1] & 1) == 0) {
              cVar4 = '\0';
              if ((*(byte *)(iVar10 + 0x11) & 8) == 0) {
                uVar3 = 1 << (*(byte *)(iVar10 + 0x2b) & 0x1f);
                cVar4 = '\x01' - ((*(uint *)(&DAT_005a7dc4 + (uint)*pbVar11 * 0x16) & uVar3) == 0);
              }
              else {
                uVar3 = (uint)*pbVar11 * 0xb;
                if (((&DAT_005a7dcd)[(uint)*pbVar11 * 0x16] & 4) != 0) {
                  cVar4 = '\x01';
                }
              }
              if (cVar4 != '\0') {
                uVar2 = *local_24;
                FUN_00438730((short)uVar2,CONCAT31((int3)(uVar3 >> 8),*pbVar11),pbVar11 + 6,0);
                FUN_00436d00(iVar10,(short)uVar2,bVar7);
              }
            }
            bVar7 = bVar7 + 1;
            if (7 < bVar7) {
              bVar7 = 0;
            }
            pbVar11 = pbVar11 + 10;
            local_24 = local_24 + 1;
            local_34 = local_34 + -1;
          } while (local_34 != 0);
        }
      }
    }
  }
  puVar12 = (undefined4 *)(param_1 + 0x8bf);
  for (iVar5 = 0x14; iVar5 != 0; iVar5 = iVar5 + -1) {
    *puVar12 = 0;
    puVar12 = puVar12 + 1;
  }
  *(undefined2 *)puVar12 = 0;
  return local_2c;
}
