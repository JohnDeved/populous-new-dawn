/* Ghidra 12.1.3 pseudocode; entry 00463e80; FUN_00463e80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00463e80(int param_1)

{
  undefined1 uVar1;
  char cVar2;
  int iVar3;

  iVar3 = FUN_00466760(param_1);
  if (((iVar3 != 0) && (*(short *)(iVar3 + 0x5f) != 0)) && (*(char *)(iVar3 + 0x7e) == '\0')) {
    if (*(short *)(param_1 + 0x9a) == 0) {
      cVar2 = FUN_00465c50(param_1);
      if (cVar2 == '\0') {
        uVar1 = unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0xb;
        if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
          empty_unit_function(param_1);
          *(undefined1 *)(param_1 + 0x2c) = uVar1;
          init_unit_class(param_1);
        }
      }
      else {
        *(undefined2 *)(param_1 + 0x9a) = 0x14;
      }
    }
    else {
      *(short *)(param_1 + 0x9a) = *(short *)(param_1 + 0x9a) + -1;
    }
  }
  if ((*(uint *)(param_1 + 0x92) & 2) != 0) {
    *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) & 0xfffffffd;
    FUN_00465ea0(param_1);
  }
  return;
}
