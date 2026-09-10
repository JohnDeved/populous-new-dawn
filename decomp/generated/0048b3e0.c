/* Ghidra 12.1.3 pseudocode; entry 0048b3e0; FUN_0048b3e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0048b3e0(void)

{
  undefined4 *puVar1;

  if (DAT_00895daf != '\0') {
    puVar1 = DAT_0089ce6d;
    if (DAT_00895db0 != '\0') {
      for (; puVar1 != (undefined4 *)0x0; puVar1 = (undefined4 *)*puVar1) {
        FUN_0048b010(puVar1,1);
      }
    }
    DAT_00895db0 = '\x01';
  }
  return;
}
