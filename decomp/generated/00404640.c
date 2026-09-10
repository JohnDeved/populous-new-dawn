/* Ghidra 12.1.3 pseudocode; entry 00404640; load_smoke.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int load_smoke(void)

{
  char cVar1;
  byte bVar2;
  int iVar3;
  byte *pbVar4;
  uint uVar5;
  int iVar6;
  byte *_Src;
  undefined4 *puVar7;
  char *pcVar8;
  undefined2 local_14;
  undefined2 local_12;
  undefined2 local_10 [2];
  int local_c;
  int local_8;
  int local_4;

  iVar6 = 0;
  puVar7 = &smoke_mem;
  for (iVar3 = 0xb4; _Src = big_temp_buffer, iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar7 = 0;
    puVar7 = puVar7 + 1;
  }
  reset_global_palettes();
  no_file_message();
  file_name_validation(global_string_buffer,s_data_smoke_txt_00599870);
  iVar3 = read_file_to_mem(global_string_buffer,_Src,0xfffffff,&local_c);
  if (iVar3 == 0) {
    for (pbVar4 = _Src; pbVar4 < _Src + local_c; pbVar4 = pbVar4 + 1) {
      if (*pbVar4 == 10) {
        *pbVar4 = 0;
      }
    }
    uVar5 = 0xffffffff;
    pcVar8 = s_SMOKE_00599868;
    do {
      if (uVar5 == 0) break;
      uVar5 = uVar5 - 1;
      cVar1 = *pcVar8;
      pcVar8 = pcVar8 + 1;
    } while (cVar1 != '\0');
    pbVar4 = _Src + local_c;
    for (; _Src < pbVar4; _Src = _Src + 1) {
      iVar3 = _iswctype((ushort)*_Src,8);
      while (iVar3 != 0) {
        _Src = _Src + 1;
        iVar3 = _iswctype((ushort)*_Src,8);
      }
      if ((((*_Src != 0x23) && (*_Src == 0x53)) && (_Src[1] == 0x4d)) &&
         (((_Src[2] == 0x4f && (_Src[3] == 0x4b)) && (_Src[4] == 0x45)))) {
        _Src = _Src + (~uVar5 - 1);
        iVar3 = _sscanf((char *)_Src,s__d__d__d__d__d_00599858,&local_8,&local_4,&local_14,&local_12
                        ,local_10);
        if (iVar3 == 5) {
          iVar3 = (local_8 * 4 + local_4) * 6;
          iVar6 = iVar6 + 1;
          *(undefined2 *)((int)&smoke_mem + iVar3) = local_14;
          *(undefined2 *)((int)&smoke_mem + iVar3 + 2) = local_12;
          *(undefined2 *)((int)&smoke_mem_2 + iVar3) = local_10[0];
        }
      }
      bVar2 = *_Src;
      while (bVar2 != 0) {
        _Src = _Src + 1;
        bVar2 = *_Src;
      }
    }
  }
  return iVar6;
}
