/* Ghidra 12.1.3 pseudocode; entry 00443260; FUN_00443260.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_00443260(byte param_1)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  int iVar4;
  ushort *puVar5;
  int iVar6;
  undefined1 local_33d;
  undefined *local_33c;
  int local_334;
  undefined1 local_330 [272];
  char local_220 [272];
  char local_110 [272];

  uVar2 = DAT_0089d184;
  local_33d = 1;
  FUN_004fffe0(local_330,&DAT_005999ec,0);
  _sprintf(local_110,s__s__s_d__s_0059ccc4,local_330,s_GAMN0_0059ccd8,(uint)param_1,&DAT_00599850);
  _sprintf(local_220,s__s__s_d__s_0059ccc4,local_330,s_GAMN0_0059ccd8,(uint)param_1,&DAT_00599834);
  iVar3 = FUN_00428210(local_110,local_220,0x6b);
  if (iVar3 == 0) {
    local_33d = 0;
  }
  else {
    DAT_00895819 = 0xffffffff;
    FUN_00462d70();
    DAT_0096aa74 = &DAT_0096aaba;
    if (((byte)DAT_0089c661 & 2) == 0) {
      FUN_0041b5c0(0);
    }
    FUN_00494930(0);
    FUN_004ee300();
    FUN_004ecac0();
    FUN_00503230();
    local_33c = &DAT_0089d1c8;
    local_334 = 4;
    do {
      FUN_00435c40(local_33c);
      FUN_00418ce0(local_33c,0xe);
      for (iVar3 = *(int *)(local_33c + 0x881); iVar3 != 0; iVar3 = *(int *)(iVar3 + 8)) {
        *(uint *)(iVar3 + 0x14) = *(uint *)(iVar3 + 0x14) & 0xffffff7f;
        *(byte *)(iVar3 + 0x7a) = *(byte *)(iVar3 + 0x7a) & 0x7f;
        if (*(ushort *)(iVar3 + 0x9f) != 0) {
          iVar4 = (&DAT_00890390)[*(ushort *)(iVar3 + 0x9f)];
          iVar6 = 0;
          if (((*(uint *)(iVar4 + 0xc) & 1) == 0) && (*(char *)(iVar4 + 0x2a) != '\0')) {
            iVar6 = iVar4;
          }
          if (((iVar6 != 0) && (*(char *)(iVar6 + 0x9e) != '\0')) &&
             (iVar4 = (int)(char)(&DAT_005a7940)[(uint)*(byte *)(iVar6 + 0x2b) * 0x17], 0 < iVar4))
          {
            puVar5 = (ushort *)(iVar6 + 0x7a);
            do {
              iVar6 = 0;
              if (((*puVar5 != 0) &&
                  (iVar1 = (&DAT_00890390)[*puVar5], (*(uint *)(iVar1 + 0xc) & 1) == 0)) &&
                 (*(char *)(iVar1 + 0x2a) != '\0')) {
                iVar6 = iVar1;
              }
              if ((iVar6 != 0) && (iVar3 != iVar6)) {
                *(uint *)(iVar6 + 0x14) = *(uint *)(iVar6 + 0x14) & 0xffffff7f;
                *(byte *)(iVar6 + 0x7a) = *(byte *)(iVar6 + 0x7a) & 0x7f;
              }
              puVar5 = puVar5 + 1;
              iVar4 = iVar4 + -1;
            } while (iVar4 != 0);
          }
        }
      }
      local_33c = local_33c + 0xc65;
      local_334 = local_334 + -1;
    } while (local_334 != 0);
    FUN_0047a550(0,&DAT_0089d1c8 + DAT_0089c6f0 * 0xc65);
    FUN_004776c0();
    FUN_00503f60();
    _DAT_0087ca1c = _DAT_0087ca1c | 0x80;
    FUN_004bdd40(0,0x40);
    FUN_00415580();
    FUN_004154a0();
    FUN_004319e0();
    FUN_004a2620((DAT_0089d17c & 0x20) >> 5);
    FUN_00419510();
  }
  DAT_0089d184 = uVar2;
  DAT_006841fc = uVar2;
  _DAT_006841f4 = uVar2;
  return CONCAT31((int3)((uint)uVar2 >> 8),local_33d);
}
