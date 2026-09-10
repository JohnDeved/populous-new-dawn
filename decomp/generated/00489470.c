/* Ghidra 12.1.3 pseudocode; entry 00489470; FUN_00489470.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 __thiscall FUN_00489470(int param_1,byte param_2,byte param_3,byte param_4)

{
  byte bVar1;
  undefined4 *puVar2;
  int iVar3;
  byte bVar4;

  puVar2 = *(undefined4 **)(param_1 + (uint)param_2 * 4);
  do {
    if (puVar2 == (undefined4 *)0x0) {
      return 0;
    }
    if ((*(byte *)(puVar2 + 1) & 5) == param_4) {
      bVar1 = *(byte *)((int)puVar2 + 5);
      bVar4 = (bVar1 & 0x38) >> 3;
      if (((((bVar1 & 0x40) != 0) || ((bVar1 & 7 | bVar4) == (bVar4 | param_3 & 7))) &&
          (((land_flags_1 & 8) == 0 ||
           (((*(uint *)&struct_g2_ARRAY_00894cfe[DAT_00894cf5].field_0x1 & 4) == 0 ||
            ((*(byte *)((int)puVar2 + 10) & 1) != 0)))))) &&
         (((*(byte *)((int)puVar2 + 10) & 2) == 0 || ((land_flags_1 & 0x8000) != 0)))) {
        if (*(code **)((int)puVar2 + 6) == (code *)0x0) {
          return *puVar2;
        }
        iVar3 = (**(code **)((int)puVar2 + 6))();
        if (iVar3 != 0) {
          return *puVar2;
        }
      }
    }
    puVar2 = *(undefined4 **)((int)puVar2 + 0xb);
  } while( true );
}
