/* Ghidra 12.1.3 pseudocode; entry 0042f640; create_clipper.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

uint create_clipper(int *param_1)

{
  uint uVar1;
  int iVar2;
  uint uVar3;
  int unaff_EDI;
  undefined4 *puVar4;
  int unaff_retaddr;
  int *in_stack_0000001c;
  uint uVar5;
  int iStack_4ac;
  undefined4 local_4a8 [13];
  undefined1 auStack_474 [16];
  undefined1 auStack_464 [8];
  int iStack_45c;
  undefined1 auStack_450 [40];
  undefined1 auStack_428 [20];
  undefined1 auStack_414 [1012];
  int iStack_20;
  uint uStack_1c;
  ushort uStack_18;
  uint uStack_14;
  undefined4 uStack_c;
  int iStack_8;
  int iStack_4;

  puVar4 = local_4a8;
  for (iVar2 = 0x1b; iVar2 != 0; iVar2 = iVar2 + -1) {
    *puVar4 = 0;
    puVar4 = puVar4 + 1;
  }
  local_4a8[0] = 0x6c;
  uVar1 = (**(code **)(*in_stack_0000001c + 100))(in_stack_0000001c,0,local_4a8,0x821,0);
  if (uVar1 == 0) {
    count_ones_and_zeroes(auStack_474,auStack_450);
    uVar1 = (**(code **)(*param_1 + 0x10))(param_1,0,0,0x100,auStack_414);
    if (uVar1 == 0) {
      uVar1 = 0;
      if (uStack_18 != 0) {
        uVar3 = (uint)uStack_18;
        uVar5 = uStack_14 & 0xffff;
        iVar2 = iStack_20;
        do {
          if (unaff_retaddr == 0) {
            FUN_0042f980(iVar2,(uVar1 + iStack_4) * unaff_EDI +
                               ((int)(iStack_45c + (iStack_45c >> 0x1f & 7U)) >> 3) * iStack_8 +
                               iStack_4ac,auStack_464,auStack_428,uStack_1c & 0xffff,param_1);
          }
          else {
            FUN_0042fb30(iVar2,(uVar1 + iStack_4) * unaff_EDI +
                               ((int)(iStack_45c + (iStack_45c >> 0x1f & 7U)) >> 3) * iStack_8 +
                               iStack_4ac,auStack_464,auStack_428,uStack_1c & 0xffff,unaff_retaddr);
          }
          iVar2 = iVar2 + uVar5;
          uVar1 = uVar1 + 1;
        } while (uVar1 < uVar3);
      }
      uVar1 = (*(code *)in_stack_0000001c[0x20])(uStack_c,iStack_4ac);
      uVar1 = (uVar1 == 0) - 1 & uVar1;
    }
  }
  return uVar1;
}
