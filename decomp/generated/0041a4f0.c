/* Ghidra 12.1.3 pseudocode; entry 0041a4f0; add_mana.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_mana(int param_1,int param_2)

{
  *(int *)(param_1 + 0x955) = *(int *)(param_1 + 0x955) + param_2;
  return;
}
