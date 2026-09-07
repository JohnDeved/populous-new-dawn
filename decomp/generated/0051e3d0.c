/* Ghidra 12.1.3 pseudocode; entry 0051e3d0; FUN_0051e3d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0051e3d0(undefined2 *param_1,int param_2,char param_3)

{
  char cVar1;
  short sVar2;
  undefined2 local_8;
  undefined2 local_6;

  local_8 = *(undefined2 *)(param_2 + 0x3d);
  local_6 = *(undefined2 *)(param_2 + 0x3f);
  cVar1 = *(char *)(param_2 + 0x68);
  if (cVar1 == '\x02') {
    if (param_3 != '\x01') goto LAB_0051e490;
    sVar2 = *(short *)(param_2 + 0x26);
  }
  else if (cVar1 == '\x03') {
    if (param_3 == '\x01') {
      sVar2 = *(short *)(param_2 + 0x26);
    }
    else {
      if (param_3 != '\x02') goto LAB_0051e490;
      sVar2 = *(short *)(param_2 + 0x26) + 0x200;
    }
  }
  else {
    if (cVar1 != '\x04') goto LAB_0051e490;
    if (param_3 == '\x01') {
      sVar2 = *(short *)(param_2 + 0x26);
    }
    else if (param_3 == '\x02') {
      sVar2 = *(short *)(param_2 + 0x26) + 0x2aa;
    }
    else {
      if (param_3 != '\x03') goto LAB_0051e490;
      sVar2 = *(short *)(param_2 + 0x26) + 0x555;
    }
  }
  move_pos_angle_length(&local_8,sVar2,0xb4);
LAB_0051e490:
  *param_1 = local_8;
  param_1[1] = local_6;
  return;
}
