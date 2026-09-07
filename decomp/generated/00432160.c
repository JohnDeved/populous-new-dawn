/* Ghidra 12.1.3 pseudocode; entry 00432160; FUN_00432160.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00432160(int param_1)

{
  ushort uVar1;
  undefined2 *puVar2;
  int iVar3;
  uint uVar4;
  int local_4;

  if (DAT_006841e4 < '\x10') {
    local_4 = 0;
    puVar2 = &DAT_00684132;
    DAT_006841e4 = DAT_006841e4 + '\x01';
    do {
      if ((puVar2[1] & 0x3fff) == 0) break;
      local_4 = local_4 + 1;
      puVar2 = puVar2 + 2;
    } while (local_4 < 0x10);
  }
  else {
    iVar3 = 0;
    puVar2 = &DAT_00684132;
    uVar4 = 0xfffffff;
    do {
      if (((ushort)puVar2[1] & 0x3fff) < uVar4) {
        uVar4 = (ushort)puVar2[1] & 0x3fff;
        local_4 = iVar3;
      }
      iVar3 = iVar3 + 1;
      puVar2 = puVar2 + 2;
    } while (iVar3 < 0x10);
  }
  (&DAT_00684132)[local_4 * 2] = *(undefined2 *)(param_1 + 0x14);
  uVar1 = (ushort)CONCAT31((uint3)((byte)((ushort)(&DAT_00684134)[local_4 * 2] >> 8) & 0xc0),200);
  (&DAT_00684134)[local_4 * 2] = uVar1;
  if ((*(byte *)(param_1 + 0x22) & 0x80) != 0) {
    (&DAT_00684134)[local_4 * 2] = uVar1 << 2 | uVar1 & 0xc000;
  }
  return;
}
