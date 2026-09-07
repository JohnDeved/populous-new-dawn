/* Ghidra 12.1.3 pseudocode; entry 0040c670; load_objs_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_objs_1(char param_1)

{
  if (param_1 == '\0') {
    param_1 = '\x02';
  }
  load_objs(param_1);
  return;
}
