/* Ghidra 12.1.3 pseudocode; entry 0055c7b0; __controlfp.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* Library Function - Single Match
    __controlfp

   Library: Visual Studio 1998 Release */

uint __cdecl __controlfp(uint _NewValue,uint _Mask)

{
  uint uVar1;

  uVar1 = __control87(_NewValue,_Mask & 0xfff7ffff);
  return uVar1;
}
