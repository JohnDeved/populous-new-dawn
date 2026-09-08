/* Ghidra 12.1.3 pseudocode; entry 004b0870; wnd_callback_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


LRESULT __thiscall wnd_callback_2(int param_1,HWND param_2,uint param_3,uint param_4,LPARAM param_5)

{
  int iVar1;
  LRESULT LVar2;
  HWND pHVar3;
  tagPAINTSTRUCT local_40;

  iVar1 = get_font_type();
  if ((iVar1 != 0) && (iVar1 = FUN_004544f0(param_2,param_3,param_4,param_5), iVar1 == 1)) {
    return 0;
  }
  if (param_3 < 7) {
    if (param_3 == 6) {
      if ((param_4 == 0) || (pHVar3 = GetForegroundWindow(), pHVar3 != window_handle)) {
        *(undefined4 *)(param_1 + 0xe4) = 0;
      }
      else {
        *(undefined4 *)(param_1 + 0xe4) = 1;
      }
      if (((*(int *)(param_1 + 0xc4) != 0) && (*(int *)(param_1 + 0xc0) != 0)) &&
         (direct_draw_surface != (LPDIRECTDRAWSURFACE)0x0)) {
        (*direct_draw_surface->lpVtbl->SetPalette)
                  (direct_draw_surface,*(LPDIRECTDRAWPALETTE *)(param_1 + 0xb4));
        *(undefined4 *)(param_1 + 0xc4) = 0;
      }
      if (DAT_0089c6e7 == '\x04') {
        FUN_004ae5b0(1,0,1);
      }
    }
    else if (param_3 == 2) {
      window_handle = (HWND)0x0;
    }
  }
  else if (param_3 < 0x1d) {
    if (param_3 == 0x1c) {
      DAT_005cdc40 = param_4;
      if (DAT_0089c6e7 == '\x04') {
        FUN_004ae5b0(1,0,1);
      }
    }
    else {
      if (param_3 == 0xf) {
        BeginPaint(param_2,&local_40);
        if ((DAT_005cdc54 != 0) && (display_created == 0)) {
          FUN_004b0b20(window_handle);
        }
        EndPaint(param_2,&local_40);
        return 0;
      }
      if (param_3 == 0x10) {
        FUN_00500a20();
        return 0;
      }
    }
  }
  else if (param_3 < 0x102) {
    if (0xff < param_3) {
      if (param_3 != 0x100) {
        if (param_3 == 0x101) {
          *(undefined1 *)((int)&DAT_0098f140 + (param_4 & 0xff)) = 0;
        }
        return 1;
      }
      param_4 = param_4 & 0xff;
      if (*(char *)((int)&DAT_0098f140 + param_4) == '\0') {
        (&DAT_0098f240)[param_4] = 1;
      }
      *(undefined1 *)((int)&DAT_0098f140 + param_4) = 1;
      return 1;
    }
    if (param_3 == 0x20) {
      SetCursor((HCURSOR)0x0);
      return 1;
    }
    if ((param_3 == 0x21) && (DAT_0089c6e7 == '\x04')) {
      FUN_004ae5b0(1,0,1);
    }
  }
  else if ((param_3 == 0x218) && (param_4 == 0)) {
    return 0x424d5144;
  }
  LVar2 = DefWindowProcA(param_2,param_3,param_4,param_5);
  return LVar2;
}
