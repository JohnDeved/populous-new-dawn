/* Ghidra 12.1.3 pseudocode; entry 0049c7a0; FUN_0049c7a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0049c7a0(undefined2 *param_1,int param_2,int *param_3)

{
  byte bVar1;
  char cVar2;
  int iVar3;
  ushort *puVar4;
  undefined2 local_c;
  undefined2 local_a;
  undefined1 local_8 [4];
  undefined1 local_4 [4];

  iVar3 = 0;
  bVar1 = FUN_0049a2f0(2,0,0,3);
  if (bVar1 != 0) {
    local_c = CONCAT11((char)((ushort)param_1[1] >> 8),(char)((ushort)*param_1 >> 8)) & 0xfefe;
    cVar2 = FUN_0049a3f0(bVar1,local_4,local_8);
    if (cVar2 != '\0') {
      puVar4 = (ushort *)(param_2 + 4);
      do {
        iVar3 = iVar3 + 1;
        local_a = CONCAT11(local_8[0] * '\x02' + local_c._1_1_,local_4[0] * '\x02' + (char)local_c);
        *puVar4 = local_a;
        *(undefined4 **)(puVar4 + -2) = &DAT_008a03e4 + ((local_a & 0xfe) * 2 | local_a & 0xfe00);
        cVar2 = FUN_0049a3f0(bVar1,local_4,local_8);
        puVar4 = puVar4 + 4;
      } while (cVar2 != '\0');
    }
    (&DAT_0089290d)[(uint)bVar1 * 0xc] = 0;
  }
  *param_3 = iVar3;
  return;
}
