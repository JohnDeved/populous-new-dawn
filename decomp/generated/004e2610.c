/* Ghidra 12.1.3 pseudocode; entry 004e2610; FUN_004e2610.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e2610(int param_1,char param_2)

{
  ushort uVar1;
  int iVar2;
  short sVar3;

  switch(param_2) {
  case '\0':
    *(ushort *)(param_1 + 0x5f) = (-(ushort)(*(char *)(param_1 + 0x2d) == '\x05') & 0xffd8) + 0x50;
    sVar3 = (-(ushort)(*(short *)(param_1 + 0x78) == 0) & 0xfffc) + 5;
    if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
       (sVar3 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
      sVar3 = 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
    }
    unit_set_object_upper
              (param_1,CONCAT22(sVar3 >> 0xf,
                                unit_type_to_obj_indexes_map
                                [(uint)*(byte *)(param_1 + 0x2b) + sVar3 * 9]));
    *(undefined1 *)(param_1 + 0x39) = 0;
    *(undefined2 *)(param_1 + 0x37) = 1;
    return;
  case '\x01':
    *(undefined2 *)(param_1 + 0x5f) = 0;
    uVar1 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
    if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
       (uVar1 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
      uVar1 = 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
    }
    unit_set_object_upper
              (param_1,unit_type_to_obj_indexes_map
                       [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar1 * 9]);
    *(undefined1 *)(param_1 + 0x39) = 0;
    *(undefined2 *)(param_1 + 0x37) = 1;
    return;
  case '\x02':
  case '\x03':
    *(undefined2 *)(param_1 + 0x5f) = 0;
    iVar2 = (int)unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0x3f];
    unit_set_object(param_1 + 0x33,
                    CONCAT22((short)((uint)(iVar2 * 4) >> 0x10),obj_indexes_table[iVar2 * 2 + 1]),
                    obj_indexes_table[iVar2 * 2]);
    *(undefined1 *)(param_1 + 0x39) = 0;
    if (param_2 != '\x02') {
      *(undefined1 *)(param_1 + 0x39) = 1;
    }
    *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 2;
    *(undefined2 *)(param_1 + 0x37) = 0;
  }
  return;
}
