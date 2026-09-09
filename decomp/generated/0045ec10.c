/* Ghidra 12.1.3 pseudocode; entry 0045ec10; FUN_0045ec10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


wchar_t * FUN_0045ec10(undefined4 param_1,wchar_t *param_2,int param_3,wchar_t *param_4,int param_5)

{
  wchar_t wVar1;
  wchar_t *pwVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  wchar_t *local_4;

  iVar4 = -1;
  _wcscpy(param_4,(wchar_t *)&DAT_0059d870);
  iVar3 = get_wchar_str_pixel_len(param_4);
  local_4 = param_2;
  pwVar2 = param_4;
  for (iVar5 = 0; ((iVar3 < param_3 && (*param_2 != L'\0')) && (iVar5 < param_5 + -1));
      iVar5 = iVar5 + 1) {
    iVar3 = FUN_00493230(*param_2);
    if ((iVar3 != 0) && (iVar3 = FUN_004932e0(param_2[1]), iVar3 != 0)) {
      iVar4 = iVar5 + 1;
      local_4 = param_2 + 1;
    }
    *pwVar2 = *param_2;
    pwVar2[1] = L'\0';
    param_2 = param_2 + 1;
    iVar3 = get_wchar_str_pixel_len(param_4);
    pwVar2 = pwVar2 + 1;
  }
  if (*param_2 != L'\0') {
    if (-1 < iVar4) {
      if ((iVar4 != 0) && (iVar5 = FUN_004933a0(param_4[iVar4 + -1]), iVar5 != 0)) {
        iVar4 = iVar4 + -1;
      }
      param_4[iVar4] = L'\0';
      param_2 = local_4;
    }
    wVar1 = *param_2;
    while (wVar1 == L' ') {
      param_2 = param_2 + 1;
      wVar1 = *param_2;
    }
    return param_2;
  }
  return (wchar_t *)0x0;
}
