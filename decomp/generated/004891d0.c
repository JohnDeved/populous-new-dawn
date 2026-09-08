/* Ghidra 12.1.3 pseudocode; entry 004891d0; FUN_004891d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __fastcall FUN_004891d0(undefined4 *param_1)

{
  byte bVar1;
  bool bVar2;
  undefined4 *puVar3;
  int iVar4;
  byte *pbVar5;
  int iVar6;
  byte local_1;

  iVar4 = 0;
  do {
    iVar6 = iVar4 + 1;
    FUN_00488cb0(iVar4);
    iVar4 = iVar6;
  } while (iVar6 < 0xcf);
  pbVar5 = &DAT_005d5de8;
  puVar3 = param_1;
  for (iVar4 = 0x100; iVar4 != 0; iVar4 = iVar4 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  param_1[0x100] = 0;
  bVar1 = DAT_005d5de8;
  while (bVar1 != 0) {
    if ((pbVar5[5] & 0x18) == 8) {
      local_1 = *pbVar5;
    }
    else if ((pbVar5[5] & 0x18) == 0x10) {
      local_1 = FUN_00401a90(*pbVar5);
    }
    puVar3 = operator_new(0xf);
    if (puVar3 != (undefined4 *)0x0) {
      *puVar3 = *(undefined4 *)(pbVar5 + 1);
      *(byte *)((int)puVar3 + 5) = pbVar5[6];
      *(byte *)((int)puVar3 + 10) = pbVar5[7];
      *(undefined4 *)((int)puVar3 + 6) = *(undefined4 *)(pbVar5 + 8);
      *(byte *)(puVar3 + 1) = pbVar5[5];
      *(undefined4 *)((int)puVar3 + 0xb) = 0;
      if ((*(byte *)(puVar3 + 1) & 2) == 0) {
        bVar2 = false;
        iVar4 = param_1[local_1];
        if (iVar4 == 0) {
          param_1[local_1] = puVar3;
        }
        else {
          do {
            iVar6 = *(int *)(iVar4 + 0xb);
            if (iVar6 == 0) {
              bVar2 = true;
              *(int *)(iVar4 + 0xb) = (int)puVar3;
              iVar6 = iVar4;
            }
            iVar4 = iVar6;
          } while (!bVar2);
        }
      }
      else {
        bVar2 = false;
        *(byte *)(puVar3 + 1) = local_1;
        iVar4 = param_1[0x100];
        if (param_1[0x100] == 0) {
          param_1[0x100] = puVar3;
        }
        else {
          do {
            iVar6 = *(int *)(iVar4 + 0xb);
            if (iVar6 == 0) {
              bVar2 = true;
              *(int *)(iVar4 + 0xb) = (int)puVar3;
              iVar6 = iVar4;
            }
            iVar4 = iVar6;
          } while (!bVar2);
        }
      }
    }
    pbVar5 = pbVar5 + 0xc;
    bVar1 = *pbVar5;
  }
  return;
}
