/* Ghidra 12.1.3 pseudocode; entry 0041b0c0; FUN_0041b0c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0041b0c0(int param_1,int *param_2,int param_3,int param_4)

{
  short sVar1;
  int iVar2;
  int iVar3;

  sVar1 = *(short *)(*(char *)(param_1 + 0x2f) * 0xc65 + 0x89dbef + param_3 * 2);
  iVar2 = DAT_005aa578;
  if ((((3 < sVar1) && (iVar2 = DAT_005aa57c, 7 < sVar1)) && (iVar2 = DAT_005aa580, 0xb < sVar1)) &&
     ((iVar2 = DAT_005aa584, 0xf < sVar1 && (iVar2 = DAT_005aa58c, sVar1 < 0x15)))) {
    iVar2 = DAT_005aa588;
  }
  if (game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f == '\x02') {
    iVar3 = unit_type_array_person[param_3].train_mana;
  }
  else {
    iVar3 = unit_type_array_person[param_3].train_mana_2;
  }
  iVar2 = iVar2 * iVar3 * param_4;
  iVar2 = iVar2 + (iVar2 >> 0x1f & 0xffU);
  iVar3 = iVar2 >> 8;
  *param_2 = iVar3;
  return CONCAT31((int3)(short)((uint)iVar2 >> 0x10),iVar3 <= (int)(uint)*(ushort *)(param_1 + 0x98)
                 );
}
