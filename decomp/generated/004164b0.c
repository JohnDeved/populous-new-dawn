/* Ghidra 12.1.3 pseudocode; entry 004164b0; FUN_004164b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004164b0(int param_1,uint param_2)

{
  int iVar1;
  undefined *puVar2;

  if (((land_flags_1._3_1_ & 2) != 0) && (DAT_008956e0 == '\0')) {
    if (num_tribes_2 == 0) {
      num_tribes_2 = 1;
    }
    if (4 < num_tribes_2) {
      num_tribes_2 = 4;
    }
    iVar1 = 0;
    DAT_008956e0 = '\x01';
    if (param_1 == 0) {
      iVar1 = num_tribes_2 - 1;
      puVar2 = (undefined *)(&DAT_00599c4c)[num_tribes_2];
    }
    else {
      puVar2 = PTR_s_Allied_00599c50;
      if ((param_2 != num_tribes_2) && (param_2 != 0)) {
        iVar1 = (int)(num_tribes_2 - 1) / (int)param_2;
      }
    }
    _sprintf(&DAT_005fe128,s__s__d_00599efc,puVar2,iVar1);
    SendMSResults(&DAT_005fe128);
  }
  return;
}
