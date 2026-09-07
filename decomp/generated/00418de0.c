/* Ghidra 12.1.3 pseudocode; entry 00418de0; set_objs0_flags.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_objs0_flags(void)

{
  *(byte *)&objs0_mem[0x1e].flags = *(byte *)&objs0_mem[0x1e].flags | 1;
  *(byte *)&objs0_mem[0x8f].flags = *(byte *)&objs0_mem[0x8f].flags | 1;
  *(byte *)&objs0_mem[0x90].flags = *(byte *)&objs0_mem[0x90].flags | 1;
  *(byte *)&objs0_mem[0x90].flags = *(byte *)&objs0_mem[0x90].flags | 1;
  *(byte *)&objs0_mem[0x3e].flags = *(byte *)&objs0_mem[0x3e].flags | 1;
  *(byte *)&objs0_mem[0x45].flags = *(byte *)&objs0_mem[0x45].flags | 1;
  return;
}
