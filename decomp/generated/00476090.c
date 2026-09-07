/* Ghidra 12.1.3 pseudocode; entry 00476090; convert_sprite_coords.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void convert_sprite_coords(int param_1,int *param_2,int *param_3)

{
  int iVar1;
  int iVar2;

  iVar1 = *param_2;
  iVar2 = *param_3;
  if (param_1 < 0) {
    if ((level_flags_1 & 0x380) == 0) {
      iVar1 = (int)(DAT_0087ca70 * iVar1 + (DAT_0087ca70 * iVar1 >> 0x1f & 0xffU)) >> 8;
      iVar2 = (int)(DAT_0087ca70 * iVar2 + (DAT_0087ca70 * iVar2 >> 0x1f & 0xffU)) >> 8;
    }
    else {
      if (param_1 < 0) {
        param_1 = -param_1;
      }
      iVar1 = (tribe_ptr->matrix_related * iVar1 * 0x100) / DAT_0087ca6c;
      iVar2 = (iVar2 * 0x100 * tribe_ptr->matrix_related) / DAT_0087ca6c;
      if (0x6ff < param_1) {
        iVar1 = iVar1 + (((int)(iVar1 * 0xe + (iVar1 * 0xe >> 0x1f & 0xfU)) >> 4) *
                        (param_1 + -0x700)) / -0x700;
        iVar2 = iVar2 + (((int)(iVar2 * 0xe + (iVar2 * 0xe >> 0x1f & 0xfU)) >> 4) *
                        (param_1 + -0x700)) / -0x700;
      }
      iVar1 = (int)(DAT_0087ca70 * iVar1 + (DAT_0087ca70 * iVar1 >> 0x1f & 0xffU)) >> 0x10;
      iVar2 = (int)(DAT_0087ca70 * iVar2 + (DAT_0087ca70 * iVar2 >> 0x1f & 0xffU)) >> 0x10;
      if (iVar1 < 0x101) {
        if (iVar1 < -0x100) {
          iVar1 = -0x100;
        }
      }
      else {
        iVar1 = 0x100;
      }
      if (iVar2 < 0x101) {
        if (iVar2 < -0x100) {
          iVar2 = -0x100;
        }
      }
      else {
        iVar2 = 0x100;
      }
    }
  }
  else {
    if (param_1 < 0) {
      param_1 = -param_1;
    }
    iVar1 = (tribe_ptr->matrix_related * iVar1 * 0x10) / DAT_0087ca6c;
    iVar2 = (iVar2 * 0x10 * tribe_ptr->matrix_related) / DAT_0087ca6c;
    if (0x6ff < param_1) {
      iVar1 = iVar1 + (((int)(iVar1 * 0xe + (iVar1 * 0xe >> 0x1f & 0xfU)) >> 4) * (param_1 + -0x700)
                      ) / -0x700;
      iVar2 = iVar2 + (((int)(iVar2 * 0xe + (iVar2 * 0xe >> 0x1f & 0xfU)) >> 4) * (param_1 + -0x700)
                      ) / -0x700;
    }
    iVar1 = iVar1 >> 4;
    iVar2 = iVar2 >> 4;
    if (iVar1 < 0x101) {
      if (iVar1 < -0x100) {
        iVar1 = -0x100;
      }
    }
    else {
      iVar1 = 0x100;
    }
    if (iVar2 < 0x101) {
      if (iVar2 < -0x100) {
        iVar2 = -0x100;
      }
    }
    else {
      iVar2 = 0x100;
    }
  }
  *param_2 = iVar1;
  *param_3 = iVar2;
  return;
}
