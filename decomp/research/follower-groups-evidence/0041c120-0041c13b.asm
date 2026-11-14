0041c120: 33c0                 xor eax, eax
0041c122: 8a8868d18900         mov cl, byte ptr [eax + 0x89d168]
0041c128: 84c9                 test cl, cl
0041c12a: 7e08                 jle 0x41c134
0041c12c: fec9                 dec cl
0041c12e: 888868d18900         mov byte ptr [eax + 0x89d168], cl
0041c134: 40                   inc eax
0041c135: 83f806               cmp eax, 6
0041c138: 7ce8                 jl 0x41c122
0041c13a: c3                   ret 
