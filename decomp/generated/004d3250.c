/* Ghidra 12.1.3 pseudocode; entry 004d3250; FUN_004d3250.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_004d3250(int param_1)

{
  byte bVar1;

  bVar1 = *(byte *)(unit_type_to_obj_indexes_map + *(byte *)(param_1 + 0x2b) + 0x75);
  unit_set_object_upper(param_1,(ushort)bVar1);
  *(undefined1 *)(param_1 + 0x39) = 0;
  *(undefined2 *)(param_1 + 0x37) = 1;
  return vstart_related[(short)obj_indexes_table[(uint)(ushort)bVar1 * 2]].frame_counter *
         (obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2 + '\x01');
}
