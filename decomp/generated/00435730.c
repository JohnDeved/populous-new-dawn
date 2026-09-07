/* Ghidra 12.1.3 pseudocode; entry 00435730; FUN_00435730.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00435730(int param_1,undefined4 param_2,undefined4 param_3,undefined2 param_4)

{
  undefined4 in_EAX;
  undefined4 uVar1;

  uVar1 = CONCAT22((short)((uint)in_EAX >> 0x10),param_4);
  FUN_00435780(param_1,CONCAT31((int3)((uint)uVar1 >> 8),*(undefined1 *)(param_1 + 0x8c0)),param_2,
               param_3,uVar1,0);
  if (*(char *)(param_1 + 0x8bf) < '\b') {
    *(char *)(param_1 + 0x8c0) = *(char *)(param_1 + 0x8c0) + '\x01';
    *(char *)(param_1 + 0x8bf) = *(char *)(param_1 + 0x8bf) + '\x01';
  }
  return;
}
