/* Ghidra 12.1.3 pseudocode; entry 0046daa0; FUN_0046daa0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0046daa0(int param_1,int param_2,int param_3)

{
  float fVar1;
  uint uVar2;
  uint uVar3;
  uint uVar4;

  uVar2 = 0;
  uVar3 = 0;
  uVar4 = 0;
  if (*(uint *)(param_1 + 0xc) < 0x80000001) {
    if ((float)(int)screen_width_2 <= *(float *)(param_1 + 0xc)) {
      uVar2 = 4;
    }
  }
  else {
    uVar2 = 2;
  }
  fVar1 = (float)(int)screen_height_2;
  if (fVar1 <= *(float *)(param_1 + 0x10)) {
    uVar2 = uVar2 | 0x10;
  }
  if (uVar2 != 0) {
    if (*(uint *)(param_2 + 0xc) < 0x80000001) {
      if ((float)(int)screen_width_2 <= *(float *)(param_2 + 0xc)) {
        uVar4 = 4;
      }
    }
    else {
      uVar4 = 2;
    }
    if (fVar1 <= *(float *)(param_2 + 0x10)) {
      uVar4 = uVar4 | 0x10;
    }
    if ((uVar2 & uVar4) != 0) {
      if (*(uint *)(param_3 + 0xc) < 0x80000001) {
        if ((float)(int)screen_width_2 < *(float *)(param_3 + 0xc)) {
          uVar3 = 4;
        }
      }
      else {
        uVar3 = 2;
      }
      if (fVar1 <= *(float *)(param_3 + 0x10)) {
        uVar3 = uVar3 | 0x10;
      }
      if ((uVar3 & uVar2 & uVar4) != 0) {
        return 0;
      }
    }
  }
  return 1;
}
