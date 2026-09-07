/* Ghidra 12.1.3 pseudocode; entry 00476570; init_palette_struct.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* This function allocates and initializes 3 palettes:
    - default palette (palette_1)
    - derivative palette (palette_1 + palette_2)
    - empty palette
   It also convertes between RGBA and color bit format provided by mask_1 and mask_2. */

int * init_palette_struct(byte *param_1,int param_2,undefined4 param_3,undefined4 param_4)

{
  byte bVar1;
  byte bVar2;
  byte bVar3;
  byte bVar4;
  byte bVar5;
  byte bVar6;
  byte bVar7;
  byte bVar8;
  byte *pbVar9;
  int iVar10;
  int iVar11;
  int *piVar12;
  int iVar13;
  byte *pbVar14;
  uint uVar15;
  undefined4 *unaff_FS_OFFSET;
  byte local_4d8 [1028];
  byte local_d4;
  byte local_d0;
  byte local_cc;
  byte local_c8;
  byte local_c4;
  byte local_98;
  byte local_94;
  byte local_90;
  byte local_8c;
  byte local_88;
  int local_5c;
  byte local_58;
  byte local_54;
  byte local_50;
  byte local_4c;
  byte local_48;
  int *local_1c;
  int *local_18;
  int *local_14;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_00476923;
  *unaff_FS_OFFSET = &local_10;
  pbVar14 = local_4d8;
  do {
    pbVar14[2] = 0xff;
    pbVar9 = pbVar14 + 4;
    pbVar14[1] = 0xff;
    *pbVar14 = 0xff;
    pbVar14[3] = 0;
    pbVar14 = pbVar9;
  } while (pbVar9 < local_4d8 + 0x400);
  local_1c = operator_new(0x400);
  local_8 = 0;
  if (local_1c == (int *)0x0) {
    piVar12 = (int *)0x0;
  }
  else {
    init_palette_mask_shift_struct(param_3);
    local_5c = 0x100;
    local_14 = local_1c;
    pbVar14 = param_1;
    do {
      bVar1 = *pbVar14;
      bVar2 = pbVar14[1];
      bVar4 = local_c4 & 0x1f;
      bVar3 = pbVar14[2];
      bVar5 = local_d4 & 0x1f;
      bVar6 = local_c8 & 0x1f;
      bVar7 = local_4d8[0x400] & 0x1f;
      iVar10 = FUN_004769c0(0xff,3);
      bVar8 = local_cc & 0x1f;
      iVar11 = FUN_004769c0(bVar3,2);
      piVar12 = local_14 + 1;
      *local_14 = ((int)((uint)bVar2 * ((1 << bVar4) + -1) + 0x7f) / 0xff << bVar5) +
                  ((int)((uint)bVar1 * ((1 << bVar6) + -1) + 0x7f) / 0xff << bVar7) +
                  (iVar10 << bVar8) + (iVar11 << (local_d0 & 0x1f));
      pbVar14 = pbVar14 + 4;
      local_5c = local_5c + -1;
      local_14 = piVar12;
    } while (local_5c != 0);
    local_5c = 0;
    piVar12 = local_1c;
  }
  local_8 = 0xffffffff;
  *local_18 = (int)piVar12;
  local_14 = operator_new(0x400);
  local_8 = 1;
  if (local_14 == (void *)0x0) {
    piVar12 = (void *)0x0;
  }
  else {
    uVar15 = 0;
    init_palette_mask_shift_struct(param_4);
    do {
      pbVar14 = param_1 + (uint)*(byte *)((uVar15 | 0xf) * 0x100 + param_2) * 4;
      bVar1 = pbVar14[1];
      bVar2 = pbVar14[2];
      bVar3 = *pbVar14;
      bVar4 = local_48 & 0x1f;
      bVar5 = local_58 & 0x1f;
      iVar10 = FUN_004769c0(((uVar15 & 0xf) * 0xff) / 0xf & 0xff,3);
      bVar6 = local_4c & 0x1f;
      iVar11 = FUN_004769c0(bVar1,1);
      bVar1 = local_54 & 0x1f;
      uVar15 = uVar15 + 1;
      iVar13 = FUN_004769c0(bVar2,2);
      *(int *)((int)local_14 + uVar15 * 4 + -4) =
           ((int)((uint)bVar3 * ((1 << bVar4) + -1) + 0x7f) / 0xff << bVar5) + (iVar10 << bVar6) +
           (iVar11 << bVar1) + (iVar13 << (local_50 & 0x1f));
      piVar12 = local_14;
    } while (uVar15 < 0x100);
  }
  local_8 = 0xffffffff;
  local_18[1] = (int)piVar12;
  local_1c = operator_new(0x400);
  local_8 = 2;
  if (local_1c == (int *)0x0) {
    local_1c = (int *)0x0;
  }
  else {
    pbVar14 = local_4d8;
    init_palette_mask_shift_struct(param_3);
    local_14 = local_1c;
    do {
      bVar1 = *pbVar14;
      bVar2 = pbVar14[1];
      bVar3 = pbVar14[2];
      pbVar14 = pbVar14 + 4;
      bVar4 = local_88 & 0x1f;
      bVar5 = local_98 & 0x1f;
      iVar10 = FUN_004769c0(0xff,3);
      bVar6 = local_8c & 0x1f;
      iVar11 = FUN_004769c0(bVar3,2);
      bVar3 = local_90 & 0x1f;
      iVar13 = FUN_004769c0(bVar2,1);
      *local_14 = ((int)((uint)bVar1 * ((1 << bVar4) + -1) + 0x7f) / 0xff << bVar5) +
                  (iVar10 << bVar6) + (iVar11 << bVar3) + (iVar13 << (local_94 & 0x1f));
      local_14 = local_14 + 1;
    } while (pbVar14 < local_4d8 + 0x400);
  }
  local_18[2] = (int)local_1c;
  *unaff_FS_OFFSET = local_10;
  return local_18;
}
