/* Ghidra 12.1.3 pseudocode; entry 004b81e0; unit_processing_class_9_shape.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_processing_class_9_shape(int param_1)

{
  FUN_0051fed0(param_1);
  if (*(char *)(param_1 + 0x2c) == '\x01') {
    FUN_004b8470(param_1);
    return;
  }
  if (*(char *)(param_1 + 0x2c) != '\x02') {
    return;
  }
  FUN_004b8bb0(param_1);
  return;
}
