/* Ghidra 12.1.3 pseudocode; entry 004b8150; init_unit_class_9.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_class_9(int param_1)

{
  undefined2 extraout_var;
  undefined1 local_324 [4];
  undefined1 local_320 [4];
  undefined2 local_31c;

  if (*(char *)(param_1 + 0x2c) == '\x01') {
    FUN_004b8220(param_1);
    return;
  }
  if (*(char *)(param_1 + 0x2c) != '\x02') {
    return;
  }
  FUN_004b9d50(CONCAT22((short)((uint)local_324 >> 0x10),(ushort)*(byte *)(param_1 + 0x9b)),
               *(undefined2 *)(param_1 + 0x68),local_320,local_324);
  FUN_004b9190(local_31c,
               CONCAT31((int3)(CONCAT22(extraout_var,local_31c) >> 8),
                        *(undefined1 *)(param_1 + 0x9e)),*(undefined1 *)(param_1 + 0x9f),
               *(undefined1 *)(param_1 + 0x2f),4);
  return;
}
