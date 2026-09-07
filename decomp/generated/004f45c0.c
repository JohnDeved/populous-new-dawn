/* Ghidra 12.1.3 pseudocode; entry 004f45c0; FUN_004f45c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f45c0(int param_1,int param_2)

{
  byte bVar1;
  unit_struct *puVar2;
  byte bVar3;
  int iVar4;
  int iVar5;

  iVar5 = 0;
  puVar2 = unit_land_array[*(short *)(param_2 + 6)];
  do {
    if (puVar2 == (unit_struct *)0x0) {
      return iVar5;
    }
    if ((puVar2->unit_class == '\x01') && (puVar2->tribe_index != -1)) {
      if (((puVar2->flags_2 & 0x10000) == 0) &&
         ((((puVar2->unit_type != '\x01' && (puVar2->unit_type != '\b')) &&
           (puVar2->state != '\x17')) &&
          (((*(byte *)((int)&puVar2->flags_4 + 1) & 0x10) == 0 &&
           (iVar4 = FUN_004de7b0(puVar2,(int)*(char *)(param_1 + 0xc22)), iVar4 == 0)))))) {
        bVar3 = *(byte *)(param_1 + 0xc22);
        if ((bVar3 == 0xff) || ((bVar1 = puVar2->tribe_index, bVar1 == 0xff || (bVar3 == bVar1)))) {
          bVar3 = 1;
        }
        else {
          bVar3 = *(byte *)((int)game_state.start_n1 + (char)bVar3 + 0x9c) &
                  '\x01' << (bVar1 & 0x1f);
        }
        if (bVar3 == 0) {
          iVar5 = iVar5 + 1;
          goto LAB_004f4658;
        }
      }
      iVar5 = iVar5 + -1;
    }
LAB_004f4658:
    puVar2 = unit_land_array[puVar2->next_unit_index];
  } while( true );
}
