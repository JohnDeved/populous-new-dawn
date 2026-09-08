/* Ghidra 12.1.3 pseudocode; entry 0040b230; FUN_0040b230.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __fastcall FUN_0040b230(undefined4 param_1,undefined4 param_2,int param_3)

{
  uint uVar1;
  ushort extraout_var;
  uint uVar2;
  ushort uVar3;
  undefined2 uVar5;
  undefined2 extraout_var_00;
  int iVar4;
  int *piVar6;
  int local_324;
  int local_320 [200];

  uVar5 = (undefined2)((uint)param_2 >> 0x10);
  if ((*(char *)(param_3 + 0x2f) == player_tribe_num) && (*(char *)(param_3 + 0x2b) != '\x13')) {
    FUN_00499d90(0x4000,0x253);
    uVar5 = extraout_var_00;
  }
  FUN_004b9e20(CONCAT22((short)((uint)&local_324 >> 0x10),(ushort)*(byte *)(param_3 + 0x9b)),
               CONCAT22(uVar5,*(undefined2 *)(param_3 + 0x68)),local_320,&local_324);
  iVar4 = 0;
  if (0 < local_324) {
    piVar6 = local_320;
    do {
      iVar4 = iVar4 + 1;
      *(undefined1 *)(*piVar6 + 10) = 0x7f;
      *(uint *)*piVar6 = *(uint *)*piVar6 | 0x4000000;
      piVar6 = piVar6 + 2;
    } while (iVar4 < local_324);
  }
  iVar4 = alloc_building_damage_smoke(param_3);
  uVar3 = extraout_var;
  if (iVar4 != 0) {
    uVar2 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar1 = uVar2 >> 0xd;
    uVar2 = uVar2 * 0x80000;
    game_state.pseudo_random_val = uVar1 | uVar2;
    uVar1 = uVar1 & 0xffff00ff;
    uVar3 = (ushort)(uVar1 >> 0x10) | (ushort)(uVar2 >> 0x10);
    *(short *)(iVar4 + 0x6c) = (short)uVar1 + (short)DAT_005aa59c;
  }
  FUN_004509d0(1,CONCAT22(uVar3,*(undefined2 *)(param_3 + 0x68)),*(undefined1 *)(param_3 + 0x9b),0);
  return;
}
