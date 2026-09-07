/* Ghidra 12.1.3 pseudocode; entry 004d42a0; FUN_004d42a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d42a0(int param_1)

{
  byte bVar1;
  uint uVar2;
  char cVar3;
  undefined1 uVar4;

  if (((unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) != 0) &&
     (cVar3 = *(char *)(param_1 + 0xb2), cVar3 != '\0')) {
    if (cVar3 == '\x01') {
      if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
        *(undefined1 *)(param_1 + 0xb2) = 0;
      }
    }
    else {
      *(char *)(param_1 + 0xb2) = cVar3 + -1;
    }
  }
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
  FUN_004eefd0(param_1);
  if (((*(byte *)(param_1 + 0xc) & 0x10) == 0) ||
     (FUN_004e9b40(param_1), (*(byte *)(param_1 + 0xe) & 0x10) != 0)) goto LAB_004d4356;
  *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
  if ((game_state.level_flags & 2) == 0) {
    bVar1 = *(byte *)(param_1 + 0x2b);
LAB_004d4336:
    uVar4 = unit_type_array_person[bVar1].next_state;
  }
  else {
    bVar1 = *(byte *)(param_1 + 0x2b);
    if (bVar1 != 7) goto LAB_004d4336;
    uVar4 = 0x27;
  }
  empty_unit_function(param_1);
  *(undefined1 *)(param_1 + 0x2c) = uVar4;
  init_unit_class(param_1);
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffffffef;
LAB_004d4356:
  if ((*(char *)(param_1 + 0x7e) != '\0') &&
     (cVar3 = *(char *)(param_1 + 0x7e) + -1, *(char *)(param_1 + 0x7e) = cVar3, cVar3 == '\0')) {
    FUN_004d3ea0(param_1);
  }
  uVar2 = *(uint *)(param_1 + 0xc);
  if (((uVar2 & 0x80000000) != 0) &&
     (*(uint *)(param_1 + 0xc) = uVar2 & 0x7fffffff, (uVar2 & 0x80) == 0)) {
    FUN_004e9d80(param_1,param_1 + 0x4f);
  }
  return;
}
