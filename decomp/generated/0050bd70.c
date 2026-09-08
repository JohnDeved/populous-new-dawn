/* Ghidra 12.1.3 pseudocode; entry 0050bd70; process_lightning_elem.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_lightning_elem(int param_1)

{
  short sVar1;

  FUN_004e7a80(param_1);
  if ((-1 < *(short *)(param_1 + 0x6c)) &&
     (sVar1 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar1, sVar1 < 1)) {
    if (-0x10 < *(char *)(param_1 + 0x3c)) {
      FUN_0050beb0(param_1,4,0x1d,*(short *)(param_1 + 0x33) + 4);
      return;
    }
    FUN_0050beb0(param_1,4,1,*(short *)(param_1 + 0x33) + 4);
  }
  return;
}
