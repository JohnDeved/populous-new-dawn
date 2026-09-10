/* Ghidra 12.1.3 pseudocode; entry 004895c0; FUN_004895c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004895c0(int param_1,char param_2)

{
  undefined1 local_98 [152];

  *(char *)(param_1 + 0x16) =
       (char)((&DAT_0098ce78)[*(byte *)(param_1 + 0x1a)] * (uint)*(byte *)(param_1 + 0x14) >> 8);
  switch(*(undefined2 *)(param_1 + 0x10)) {
  case 0x1d:
  case 0x1e:
  case 0x1f:
    if (DAT_00895dcd == '\x1e') {
LAB_0048963b:
      *(undefined1 *)(param_1 + 0x16) = 0;
    }
    break;
  case 0x20:
    if ((DAT_00895dcd == '\x1e') || (DAT_00895dcd == '\x10')) goto LAB_0048963b;
    break;
  default:
    goto switchD_00489601_caseD_21;
  case 199:
  case 200:
  case 0xc9:
  case 0xca:
    if (DAT_00895dcd != '\x1e') goto LAB_0048963b;
    break;
  case 0xd5:
    if (DAT_00895dcd != '\x10') goto LAB_0048963b;
  }
  if (param_2 != '\0') {
    FUN_0056ccf0();
    FUN_0056ce30(((uint)*(byte *)(param_1 + 0x16) * (uint)DAT_00895db4) / 0x7f);
    (**(code **)(*sound_related + 0x14))(*(undefined4 *)(param_1 + 8),local_98);
  }
switchD_00489601_caseD_21:
  return;
}
