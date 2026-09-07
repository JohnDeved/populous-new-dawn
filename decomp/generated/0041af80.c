/* Ghidra 12.1.3 pseudocode; entry 0041af80; get_unit_mana.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 get_unit_mana(int param_1,int *param_2)

{
  char cVar1;
  int iVar2;

  iVar2 = 0;
  switch(*(undefined1 *)(param_1 + 0x2b)) {
  case 2:
    if ((*(byte *)(param_1 + 0xe) & 0x80) != 0) {
      *param_2 = DAT_005aa5c4;
      return 0;
    }
    if (*(char *)(param_1 + 0xa7) == '\0') {
      *param_2 = DAT_005aa5bc;
      return 0;
    }
    *param_2 = DAT_005aa5c4;
    return 0;
  case 3:
  case 5:
  case 6:
    if ((*(byte *)(param_1 + 0xe) & 0x80) != 0) {
      *param_2 = DAT_005aa5c8;
      return 0;
    }
    if (*(char *)(param_1 + 0xa7) == '\0') {
      *param_2 = DAT_005aa5c0;
      return 0;
    }
    *param_2 = DAT_005aa5c8;
    return 0;
  case 4:
    break;
  case 7:
    iVar2 = (int)unit_type_array_person[7].mana;
  default:
    *param_2 = iVar2;
    return 0;
  }
  if ((*(byte *)(param_1 + 0xe) & 0x80) != 0) {
    *param_2 = DAT_005aa5c8;
    return 0;
  }
  if (*(char *)(param_1 + 0xa7) == '\0') {
    *param_2 = DAT_005aa5c0;
    return 0;
  }
  cVar1 = FUN_004df0e0(param_1);
  if (cVar1 == '\0') {
    *param_2 = DAT_005aa5c8;
    return 0;
  }
  if ((*(byte *)(param_1 + 0x76) & 0x40) != 0) {
    *param_2 = DAT_005aa5c8;
    return 0;
  }
  *param_2 = DAT_005aa5c0;
  return 0;
}
