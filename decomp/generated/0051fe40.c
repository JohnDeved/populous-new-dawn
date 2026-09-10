/* Ghidra 12.1.3 pseudocode; entry 0051fe40; FUN_0051fe40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0051fe40(int param_1,int param_2)

{
  byte bVar1;
  bool bVar2;

  if ((unit_type_array_person[*(byte *)(param_2 + 0x2b)].flags & 0x40) == 0) {
    if ((*(uint *)(param_1 + 0x10) & 0x100000) == 0) {
      bVar1 = *(char *)(param_1 + 0x31) + 1;
      *(byte *)(param_1 + 0x31) = bVar1;
      *(undefined1 *)(param_1 + 0x32) = 0x30;
      if ((*(char *)(param_1 + 0x2a) == '\x01') || (*(char *)(param_1 + 0x2a) != '\x02')) {
        bVar2 = bVar1 < 3;
      }
      else {
        bVar2 = bVar1 < (byte)unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x21;
      }
      if (!bVar2) {
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x100000;
        return;
      }
    }
  }
  else {
    *(undefined1 *)(param_1 + 0x32) = 0x30;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x200000;
  }
  return;
}
