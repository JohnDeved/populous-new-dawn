/* Ghidra 12.1.3 pseudocode; entry 0044b770; calc_landscape_width_height.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void calc_landscape_width_height(int *param_1,int *param_2,int *param_3,int *param_4)

{
  short sVar1;
  int iVar2;
  int iVar3;
  int *piVar4;

  iVar2 = 1;
  sVar1 = DAT_00684220;
  if (0 < DAT_00684508) {
    piVar4 = &DAT_00684222;
    do {
      if (*piVar4 == DAT_0068c6c5) {
        sVar1 = (&DAT_00684220)[(short)iVar2 * 3];
        break;
      }
      piVar4 = (int *)((int)piVar4 + 6);
      iVar2 = iVar2 + 1;
    } while (iVar2 <= DAT_00684508);
  }
  if (sVar1 * 0x3e != 0) {
    iVar2 = (short)(&DAT_0068429a)[sVar1 * 0x1f] * 0x71;
    iVar3 = *(int *)((int)&DAT_0068456b + iVar2) * (int)screen_width;
    *param_1 = (int)(iVar3 + (iVar3 >> 0x1f & 0xffffU)) >> 0x10;
    iVar3 = (int)(screen_height / 2) + *(int *)((int)&DAT_0068456f + iVar2) * (int)screen_height;
    *param_2 = (int)(iVar3 + (iVar3 >> 0x1f & 0xffffU)) >> 0x10;
    iVar3 = *(int *)((int)&DAT_00684573 + iVar2) * (int)screen_width;
    *param_3 = (int)(iVar3 + (iVar3 >> 0x1f & 0xffffU)) >> 0x10;
    iVar2 = (int)(screen_height / 2) + *(int *)((int)&DAT_00684577 + iVar2) * (int)screen_height;
    *param_4 = (int)(iVar2 + (iVar2 >> 0x1f & 0xffffU)) >> 0x10;
  }
  return;
}
