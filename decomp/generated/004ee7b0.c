/* Ghidra 12.1.3 pseudocode; entry 004ee7b0; update_unit_animation.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void update_unit_animation(int param_1)

{
  short sVar1;
  int iVar2;
  uint uVar3;
  byte bVar4;
  ushort uVar5;

  uVar3 = (uint)*(byte *)(param_1 + 0x3a);
  sVar1 = *(short *)(param_1 + 0x33);
  if ((sVar1 != 0x650) && ((*(ushort *)(param_1 + 0x35) & 2) == 0)) {
    switch(obj_related_array[uVar3 + 3]._f3) {
    case 1:
      if ((*(int *)(param_1 + 0x18) == sprite_animation_counter) ||
         ((*(byte *)(param_1 + 0x16) & 4) == 0)) {
        uVar5 = (short)(char)obj_related_array[uVar3 + 3]._f2 + *(short *)(param_1 + 0x37);
        *(ushort *)(param_1 + 0x37) = uVar5;
        iVar2 = (char)obj_related_array[uVar3 + 3].f1 * 4;
        if (iVar2 <= (int)(uint)uVar5) {
          *(ushort *)(param_1 + 0x37) = uVar5 - (short)iVar2;
          switch(sVar1) {
          case 1099:
          case 0x454:
          case 0x49c:
          case 0x4aa:
          case 0x4d8:
          case 0x4f0:
          case 0x518:
            *(undefined2 *)(param_1 + 0x33) = 0x650;
            return;
          }
        }
      }
      break;
    case 2:
      if ((*(int *)(param_1 + 0x18) == sprite_animation_counter) ||
         ((*(byte *)(param_1 + 0x16) & 4) == 0)) {
        if (*(short *)(param_1 + 0x37) == 0) {
          *(short *)(param_1 + 0x37) = (short)(char)obj_related_array[uVar3 + 3]._f2;
          bVar4 = *(char *)(param_1 + 0x39) + 1;
          *(byte *)(param_1 + 0x39) = bVar4;
          if ((byte)vstart_related[sVar1].frame_counter <= bVar4) {
            *(undefined1 *)(param_1 + 0x39) = 0;
          }
        }
        else {
          *(short *)(param_1 + 0x37) = *(short *)(param_1 + 0x37) + -1;
        }
        switch(sVar1) {
        case 0:
        case 0x28:
        case 0x48:
        case 0xd8:
          if (((level_flags_2._2_1_ & 1) == 0) && (((byte)level_flags & 8) == 0)) {
            set_unit_footprints(param_1);
            return;
          }
        }
      }
      break;
    case 3:
      uVar5 = (short)(char)obj_related_array[uVar3 + 3]._f2 + *(short *)(param_1 + 0x37);
      *(ushort *)(param_1 + 0x37) = uVar5;
      iVar2 = *(char *)(param_1 + 0x3b) * 10;
      if ((char)aniob0_mem[iVar2 + 8] * 4 <= (int)(uint)uVar5) {
        *(undefined2 *)(param_1 + 0x37) = 0;
      }
      *(ushort *)(param_1 + 0x33) =
           (ushort)(byte)aniob0_mem[iVar2 + (uint)(*(ushort *)(param_1 + 0x37) >> 2)];
      return;
    case 4:
      if ((*(ushort *)(param_1 + 0x35) & 0x1000) == 0) {
        iVar2 = FUN_0040cc10(param_1);
        if ((iVar2 == 0) &&
           (((*(int *)(param_1 + 0x18) == sprite_animation_counter ||
             ((*(byte *)(param_1 + 0x16) & 4) == 0)) &&
            (uVar5 = (short)(char)obj_related_array[uVar3 + 3]._f2 + *(short *)(param_1 + 0x37),
            *(ushort *)(param_1 + 0x37) = uVar5,
            (uint)*(ushort *)
                   (*(char *)(param_1 + 0x3b) * 0x170 + 0x87ccae +
                   morph0_mem[*(char *)(param_1 + 0x3b) * 4].field1_0x4 * 10) * 4 + 4 <= (uint)uVar5
            )))) {
          *(undefined2 *)(param_1 + 0x37) = 0;
        }
      }
      else {
        sVar1 = (short)(char)obj_related_array[uVar3 + 3]._f2 + *(short *)(param_1 + 0x72);
        *(short *)(param_1 + 0x72) = sVar1;
        if ((int)((uint)*(byte *)(param_1 + 0x71) * 4) <= (int)sVar1) {
          FUN_0040cbd0(param_1);
          return;
        }
      }
    }
  }
  return;
}
