004d4320 c9                   leave 
004d4321 8ac8                 mov cl, al
004d4323 8d0489               lea eax, [ecx + ecx*4]
004d4326 8d1480               lea edx, [eax + eax*4]
004d4329 eb0b                 jmp 0x4d4336
004d432b 33c0                 xor eax, eax
004d432d 8a462b               mov al, byte ptr [esi + 0x2b]
004d4330 8d0c80               lea ecx, [eax + eax*4]
004d4333 8d1489               lea edx, [ecx + ecx*4]
004d4336 8a1c5564705a00       mov bl, byte ptr [edx*2 + 0x5a7064]
004d433d 56                   push esi
004d433e e8ad930100           call 0x4ed6f0
004d4343 83c404               add esp, 4
004d4346 885e2c               mov byte ptr [esi + 0x2c], bl
004d4349 56                   push esi
004d434a e8f1920100           call 0x4ed640
004d434f 83660cef             and dword ptr [esi + 0xc], 0xffffffef
004d4353 83c404               add esp, 4
004d4356 8a467e               mov al, byte ptr [esi + 0x7e]
