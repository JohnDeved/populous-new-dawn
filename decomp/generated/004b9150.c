/* Ghidra 12.1.3 pseudocode; entry 004b9150; FUN_004b9150.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004b9150(void)

{
  if ((DAT_00895dd4 & 0x10000) != 0) {
    FUN_004b9190(DAT_00895dd4,
                 CONCAT22((short)((uint)(DAT_00895de0 * 2) >> 0x10),
                          *(undefined2 *)(&DAT_005a8858 + DAT_00895de0 * 0x12)),DAT_00895de5,0,1);
  }
  return;
}
