/* Ghidra 12.1.3 pseudocode; entry 00402e70; FUN_00402e70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00402e70(int param_1,undefined4 *param_2)

{
  undefined4 uVar1;

  uVar1 = *param_2;
  *(undefined4 *)(param_1 + 0x68) = uVar1;
  *(ushort *)(param_1 + 0x68) = ((ushort)uVar1 & 0xfe00) + 0x100;
  *(ushort *)(param_1 + 0x6a) = (*(ushort *)(param_1 + 0x6a) & 0xfe00) + 0x100;
  *(byte *)(param_1 + 0x82) = *(byte *)(param_1 + 0x82) & 0xf0;
  *(undefined1 *)(param_1 + 0x82) = 0;
  return;
}
