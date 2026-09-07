/* Ghidra 12.1.3 pseudocode; entry 004a39c0; FUN_004a39c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a39c0(int param_1,int param_2,char param_3)

{
  int iVar1;
  int iVar2;
  int iVar3;

  iVar1 = (int)((uint)(ushort)unit_type_array_person[*(byte *)(param_2 + 0x2b)].fight_damage *
               (int)*(short *)(param_2 + 0x6e)) / (int)*(short *)(param_2 + 0x6c);
  if (iVar1 < 0x21) {
    iVar1 = 0x20;
  }
  if ((*(byte *)(param_2 + 0x16) & 8) != 0) {
    iVar1 = DAT_005aa5ac * iVar1;
  }
  iVar2 = (int)((uint)(ushort)unit_type_array_person[*(byte *)(param_1 + 0x2b)].fight_damage *
               (int)*(short *)(param_1 + 0x6e)) / (int)*(short *)(param_1 + 0x6c);
  iVar3 = iVar2;
  if (iVar2 < 0x21) {
    iVar3 = 0x20;
  }
  if ((*(byte *)(param_1 + 0x16) & 8) != 0) {
    iVar2 = DAT_005aa5ac * iVar3;
    iVar3 = iVar2;
  }
  FUN_004da080(param_1,CONCAT31((int3)((uint)iVar2 >> 8),*(undefined1 *)(param_2 + 0x2f)),iVar1,1);
  if (param_3 == '\0') {
    FUN_004da080(param_2,*(undefined1 *)(param_1 + 0x2f),iVar3,1);
    if (*(short *)(param_2 + 0x6e) < 1) {
      FUN_0041b550(*(undefined1 *)(param_2 + 0x2f),1,1);
      FUN_004f3190(param_1,param_2);
    }
  }
  if (*(short *)(param_1 + 0x6e) < 1) {
    FUN_0041b550(*(undefined1 *)(param_1 + 0x2f),1,1);
    FUN_004f3190(param_2,param_1);
  }
  return;
}
