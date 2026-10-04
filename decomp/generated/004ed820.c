/* Ghidra 12.1.3 pseudocode; entry 004ed820; FUN_004ed820.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ed820(void)

{
  undefined *puVar1;
  undefined4 *puVar2;

  DAT_00890378 = &DAT_008e04db;
  DAT_00890384 = &DAT_00937a98;
  DAT_0089037c = &DAT_008e04db;
  DAT_0089038c = &DAT_00937a98;
  puVar2 = &DAT_00890390;
  DAT_00890388 = &DAT_00930ab8;
  DAT_00890380 = &DAT_00930ab8;
  puVar1 = &DAT_008e0428;
  do {
    *puVar2 = puVar1;
    puVar2 = puVar2 + 1;
    puVar1 = puVar1 + 0xb3;
  } while (puVar2 < &DAT_008922d0);
  DAT_00890390 = 0;
  return;
}
