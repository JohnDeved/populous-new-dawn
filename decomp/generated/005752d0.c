/* Ghidra 12.1.3 pseudocode; entry 005752d0; FUN_005752d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 __thiscall FUN_005752d0(int *param_1,LPCSTR param_2)

{
  HANDLE pvVar1;
  LPVOID pvVar2;

  pvVar1 = CreateFileA(param_2,0x80000000,1,(LPSECURITY_ATTRIBUTES)0x0,3,0x10000000,(HANDLE)0x0);
  param_1[3] = (int)pvVar1;
  if (pvVar1 != (HANDLE)0xffffffff) {
    pvVar1 = CreateFileMappingA(pvVar1,(LPSECURITY_ATTRIBUTES)0x0,2,0,0,(LPCSTR)0x0);
    param_1[4] = (int)pvVar1;
    if (pvVar1 != (HANDLE)0xffffffff) {
      pvVar2 = MapViewOfFile(pvVar1,4,0,0,0);
      param_1[2] = (int)pvVar2;
      if (pvVar2 != (LPVOID)0x0) {
        return 0;
      }
    }
  }
  (**(code **)(*param_1 + 0x10))();
  return 0xffffffff;
}
