/* Ghidra 12.1.3 pseudocode; entry 0046c340; copy_vertex_and_specular.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void copy_vertex_and_specular(undefined4 *param_1,undefined4 *param_2,uint param_3)

{
  uint uVar1;
  uint uVar2;
  uint uVar3;

  *param_2 = *param_1;
  param_2[1] = param_1[1];
  uVar3 = param_1[4];
  if ((uVar3 & 0xff000000) != 0) {
    param_2[4] = uVar3;
    param_2[5] = 0;
    return;
  }
  uVar2 = 0;
  if ((int)uVar3 < 0x20) {
    uVar1 = uVar3 * 8;
  }
  else {
    uVar1 = 0xff;
    uVar3 = uVar3 * 5 - 0xa0;
    if (0x100 < uVar3) {
      uVar3 = 0x100;
    }
    uVar2 = (((param_3 & 0xff0000) >> 0x10) * uVar3 & 0xffffff00) << 8 |
            (param_3 >> 8 & 0xff) * uVar3 & 0xffffff00 | (param_3 & 0xff) * uVar3 >> 8;
  }
  param_2[5] = uVar2;
  param_2[4] = (uVar1 | 0xffffff00) << 0x10 | uVar1 << 8 | uVar1;
  return;
}
