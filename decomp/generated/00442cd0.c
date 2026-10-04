/* Ghidra 12.1.3 pseudocode; entry 00442cd0; FUN_00442cd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00442d4c) */

bool FUN_00442cd0(byte param_1)

{
  int iVar1;
  undefined1 local_330 [272];
  char local_220 [272];
  char local_110 [272];

  FUN_004fffe0(local_330,&DAT_005999ec,0);
  _sprintf(local_110,s__s__s_d__s_0059ccc4,local_330,&DAT_0059ccd0,(uint)param_1,&DAT_00599850);
  _sprintf(local_220,s__s__s_d__s_0059ccc4,local_330,&DAT_0059ccd0,(uint)param_1,&DAT_00599834);
  FUN_004f2780();
  if (((byte)DAT_0089c661 & 2) == 0) {
    FUN_0041b5c0(1);
  }
  FUN_00494930(1);
  FUN_00431970();
  FUN_00428110(0x6b);
  FUN_00428110(0x6b);
  iVar1 = FUN_0049a750(local_110,local_220,0x6b,&DAT_0089d178,0xd1964,0);
  FUN_00462d70();
  DAT_0096aa74 = &DAT_0096aaba;
  if (((byte)DAT_0089c661 & 2) == 0) {
    FUN_0041b5c0(0);
  }
  FUN_00494930(0);
  FUN_004ee300();
  FUN_004ecac0();
  return iVar1 == 0xd1964;
}
