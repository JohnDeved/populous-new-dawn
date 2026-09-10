/* Ghidra 12.1.3 pseudocode; entry 0051ddc0; FUN_0051ddc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0051ddc0(int param_1,int param_2)

{
  ushort *puVar1;
  ushort uVar2;
  char cVar3;
  undefined4 uVar4;
  undefined3 uVar5;
  undefined3 extraout_var;
  undefined1 local_1;

  local_1 = 0;
  uVar4 = FUN_0051dcc0(param_2,param_1);
  uVar5 = (undefined3)((uint)uVar4 >> 8);
  cVar3 = (char)uVar4 + -1;
  if (-1 < cVar3) {
    puVar1 = (ushort *)(param_2 + 0x70 + cVar3 * 2);
    uVar2 = *puVar1;
    if (uVar2 == 0) {
      *(char *)(param_2 + 0x68) = *(char *)(param_2 + 0x68) + '\x01';
    }
    else {
      FUN_004a3920(unit_land_array[uVar2]);
    }
    local_1 = 1;
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 0x19;
      init_unit_class(param_1);
    }
    *puVar1 = *(ushort *)(param_1 + 0x24);
    *(undefined2 *)(param_1 + 0x9d) = *(undefined2 *)(param_2 + 0x24);
    FUN_0051df90(param_2);
    uVar5 = extraout_var;
  }
  return CONCAT31(uVar5,local_1);
}
