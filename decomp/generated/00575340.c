/* Ghidra 12.1.3 pseudocode; entry 00575340; FUN_00575340.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __fastcall FUN_00575340(int param_1)

{
  if (*(LPCVOID *)(param_1 + 8) != (LPCVOID)0x0) {
    UnmapViewOfFile(*(LPCVOID *)(param_1 + 8));
    *(undefined4 *)(param_1 + 8) = 0;
  }
  if (*(HANDLE *)(param_1 + 0x10) != (HANDLE)0x0) {
    CloseHandle(*(HANDLE *)(param_1 + 0x10));
    *(undefined4 *)(param_1 + 0x10) = 0;
  }
  if (*(HANDLE *)(param_1 + 0xc) != (HANDLE)0x0) {
    CloseHandle(*(HANDLE *)(param_1 + 0xc));
    *(undefined4 *)(param_1 + 0xc) = 0;
  }
  return;
}
