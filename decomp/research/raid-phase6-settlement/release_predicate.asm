004f39f0 mov eax, dword ptr [esp + 4]
004f39f4 cmp byte ptr [eax + 0x2c], 0x21
004f39f8 jne 0x4f3a16
004f39fa mov cl, byte ptr [eax + 0x2d]
004f39fd cmp cl, 3
004f3a00 je 0x4f3a10
004f3a02 cmp cl, 2
004f3a05 jne 0x4f3a16
004f3a07 cmp byte ptr [eax + 0xa8], 4
004f3a0e jbe 0x4f3a16
004f3a10 mov eax, 1
004f3a15 ret 
004f3a16 xor eax, eax
004f3a18 ret 
