/* Ghidra 12.1.3 pseudocode; entry 004d43a0; FUN_004d43a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d43a0(int param_1)

{
  short sVar1;
  uint uVar2;
  char cVar3;

  cVar3 = FUN_004eeff0(param_1);
  if (cVar3 != '\0') {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffefffff;
    *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 2;
    init_unit_class(param_1);
  }
  uVar2 = *(uint *)(param_1 + 0xc);
  if ((uVar2 & 0x80000) == 0) {
    if ((game_state.level_flags & 0x80) == 0) {
      sVar1 = *(short *)(param_1 + 0x6e);
      if (sVar1 < 1) {
        *(uint *)(param_1 + 0xc) = uVar2 & 0xffefffff;
        *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = 3;
        init_unit_class(param_1);
        return;
      }
      if (((unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 8) != 0) &&
         (((byte)game_state.offset_counter_2 & 7) == 0)) {
        if (sVar1 < *(short *)(param_1 + 0x6c)) {
          *(ushort *)(param_1 + 0x6e) =
               (ushort)(byte)unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x1a + sVar1;
        }
        else {
          *(undefined1 *)(param_1 + 0xb0) = 0xff;
        }
        if (*(short *)(param_1 + 0x6c) >> 2 < *(short *)(param_1 + 0x6e)) {
          *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffefff;
        }
        else {
          *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x1000;
        }
      }
      if ((uVar2 & 8) != 0) {
        *(uint *)(param_1 + 0xc) = uVar2 & 0xfffffff7;
        if ((*(char *)(param_1 + 0x2c) != '\x1f') && ((uVar2 & 0x100000) == 0)) {
          *(char *)(param_1 + 0x7d) = *(char *)(param_1 + 0x2c);
          empty_unit_function(param_1);
          *(undefined1 *)(param_1 + 0x2c) = 0x1f;
          init_unit_class(param_1);
          return;
        }
      }
    }
    else {
      *(undefined2 *)(param_1 + 0x6e) = *(undefined2 *)(param_1 + 0x6c);
    }
  }
  return;
}
