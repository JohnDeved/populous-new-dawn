/* Ghidra 12.1.3 pseudocode; entry 00407810; FUN_00407810.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00407810(int param_1,int param_2)

{
  if (*(char *)(param_1 + 0x2c) != '\x04') {
    if ((*(ushort *)(param_1 + 0x9c) & 2) == 0) {
      *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xffdf;
      *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) | 2;
      *(undefined2 *)(param_1 + 0x6c) = 0;
      *(undefined2 *)(param_1 + 0x6e) = 0;
    }
    if (0 < param_2) {
      *(char *)(param_1 + 0xa7) = (char)param_2;
      return;
    }
    *(undefined1 *)(param_1 + 0xa7) = 0x10;
  }
  return;
}
