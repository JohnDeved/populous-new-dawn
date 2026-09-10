/* Ghidra 12.1.3 pseudocode; entry 004f15d0; init_keyboard.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_keyboard(void)

{
  int iVar1;
  HKL pHVar2;
  void *pvVar3;
  undefined4 uVar4;
  ushort uVar5;
  int iVar6;
  undefined4 *unaff_FS_OFFSET;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_004f1773;
  *unaff_FS_OFFSET = &local_10;
  iVar6 = 0x14;
  iVar1 = GetKeyboardType(0);
  if (iVar1 == 7) {
    iVar1 = GetKeyboardType(1);
    if ((char)((uint)iVar1 >> 8) == '\r') {
      iVar6 = 9;
    }
  }
  else {
    pHVar2 = GetKeyboardLayout(0);
    uVar5 = (ushort)pHVar2 >> 10;
    switch((uint)pHVar2 & 0x3ff) {
    case 7:
      iVar6 = 6;
      if (uVar5 == 2) {
        iVar6 = 0x13;
      }
      break;
    case 9:
      if (uVar5 == 1) {
        iVar6 = 0x15;
      }
      else {
        iVar6 = 0x14;
      }
      break;
    case 10:
      iVar6 = 0x11;
      break;
    case 0xb:
    case 0x1d:
      iVar6 = 0x12;
      break;
    case 0xc:
      iVar6 = 5;
      if (uVar5 == 2) {
        iVar6 = 0;
      }
      else if (uVar5 == 3) {
        iVar6 = 1;
      }
      else if (uVar5 == 4) {
        iVar6 = 0x13;
      }
      break;
    case 0x10:
      iVar6 = 8;
      if (uVar5 == 2) {
        iVar6 = 0x13;
      }
      break;
    case 0x13:
      iVar6 = 0xb;
      if (uVar5 == 2) {
        iVar6 = 0;
      }
      break;
    case 0x15:
      iVar6 = 0xd;
      break;
    case 0x19:
      iVar6 = 0xf;
    }
  }
  iVar1 = DAT_005f0550;
  if (DAT_005f0550 != 0) {
    FUN_00401a10();
    free_2(iVar1);
  }
  DAT_005f0550 = 0;
  if (font_type == 7) {
    iVar6 = 0xd;
  }
  if (font_type == 8) {
    iVar6 = 0xf;
  }
  pvVar3 = operator_new(0x378);
  local_8 = 0;
  uVar4 = 0;
  if (pvVar3 != (void *)0x0) {
    uVar4 = FUN_00401990(*(undefined4 *)(iVar6 * 4 + 0x5a1a80));
  }
  DAT_005f0550 = uVar4;
  DAT_0089bc6e = iVar6;
  *unaff_FS_OFFSET = local_10;
  return;
}
