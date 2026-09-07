/* Ghidra 12.1.3 pseudocode; entry 0055c770; __control87.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* Library Function - Single Match
    __control87

   Library: Visual Studio 1998 Release */

uint __cdecl __control87(uint _NewValue,uint _Mask)

{
  uint uVar1;

  uVar1 = __abstract_cw();
  uVar1 = ~_Mask & uVar1 | _Mask & _NewValue;
  __hw_cw(uVar1);
  return uVar1;
}
