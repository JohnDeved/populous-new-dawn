0047c350: 807c240800           cmp byte ptr [esp + 8], 0
0047c355: 53                   push ebx
0047c356: 56                   push esi
0047c357: 0f84da000000         je 0x47c437
0047c35d: 33c0                 xor eax, eax
0047c35f: a0f0c68900           mov al, byte ptr [0x89c6f0]
0047c364: 8d1440               lea edx, [eax + eax*2]
0047c367: 8d8c9297798900       lea ecx, [edx + edx*4 + 0x897997]
0047c36e: 32d2                 xor dl, dl
0047c370: f60562c6890008       test byte ptr [0x89c662], 8
0047c377: 7554                 jne 0x47c3cd
0047c379: b83b000000           mov eax, 0x3b
0047c37e: 83f846               cmp eax, 0x46
0047c381: 770f                 ja 0x47c392
0047c383: 33db                 xor ebx, ebx
0047c385: 8a98e0c44700         mov bl, byte ptr [eax + 0x47c4e0]
0047c38b: ff249dc4c44700       jmp dword ptr [ebx*4 + 0x47c4c4]
0047c392: 80790c00             cmp byte ptr [ecx + 0xc], 0
0047c396: 751c                 jne 0x47c3b4
0047c398: eb18                 jmp 0x47c3b2
0047c39a: 810d61c6890000080000 or dword ptr [0x89c661], 0x800
0047c3a4: 810d61c6890000008000 or dword ptr [0x89c661], 0x800000
0047c3ae: b201                 mov dl, 1
0047c3b0: eb02                 jmp 0x47c3b4
0047c3b2: b201                 mov dl, 1
0047c3b4: 84d2                 test dl, dl
0047c3b6: 7415                 je 0x47c3cd
0047c3b8: c6410c47             mov byte ptr [ecx + 0xc], 0x47
0047c3bc: 0fbe44240c           movsx eax, byte ptr [esp + 0xc]
0047c3c1: 894104               mov dword ptr [ecx + 4], eax
0047c3c4: 33c0                 xor eax, eax
0047c3c6: 8a442418             mov al, byte ptr [esp + 0x18]
0047c3ca: 894108               mov dword ptr [ecx + 8], eax
0047c3cd: 807c241400           cmp byte ptr [esp + 0x14], 0
0047c3d2: 0f84cd000000         je 0x47c4a5
0047c3d8: 0fbe05f0c68900       movsx eax, byte ptr [0x89c6f0]
0047c3df: 8bc8                 mov ecx, eax
0047c3e1: 8d1480               lea edx, [eax + eax*4]
0047c3e4: 8d0451               lea eax, [ecx + edx*2]
0047c3e7: 8d1cc0               lea ebx, [eax + eax*8]
0047c3ea: 32c0                 xor al, al
0047c3ec: 8d14d9               lea edx, [ecx + ebx*8]
0047c3ef: 8bb49149da8900       mov esi, dword ptr [ecx + edx*4 + 0x89da49]
0047c3f6: b201                 mov dl, 1
0047c3f8: 8a4c240c             mov cl, byte ptr [esp + 0xc]
0047c3fc: d2e2                 shl dl, cl
0047c3fe: 85f6                 test esi, esi
0047c400: 7410                 je 0x47c412
0047c402: 84567a               test byte ptr [esi + 0x7a], dl
0047c405: 7509                 jne 0x47c410
0047c407: 8b7608               mov esi, dword ptr [esi + 8]
0047c40a: 85f6                 test esi, esi
0047c40c: 75f4                 jne 0x47c402
0047c40e: eb02                 jmp 0x47c412
0047c410: b001                 mov al, 1
0047c412: 84c0                 test al, al
0047c414: 0f848b000000         je 0x47c4a5
0047c41a: 6a00                 push 0
0047c41c: 8d463d               lea eax, [esi + 0x3d]
0047c41f: 6aff                 push -1
0047c421: 50                   push eax
0047c422: e879b8f9ff           call 0x417ca0
0047c427: 83c40c               add esp, 0xc
0047c42a: 6a00                 push 0
0047c42c: 56                   push esi
0047c42d: e85e810800           call 0x504590
0047c432: 83c408               add esp, 8
0047c435: eb6e                 jmp 0x47c4a5
0047c437: 33c0                 xor eax, eax
0047c439: a0f0c68900           mov al, byte ptr [0x89c6f0]
0047c43e: 8d1440               lea edx, [eax + eax*2]
0047c441: 8d8c9297798900       lea ecx, [edx + edx*4 + 0x897997]
0047c448: 32d2                 xor dl, dl
0047c44a: f60562c6890008       test byte ptr [0x89c662], 8
0047c451: 7552                 jne 0x47c4a5
0047c453: b83a000000           mov eax, 0x3a
0047c458: 83f846               cmp eax, 0x46
0047c45b: 770f                 ja 0x47c46c
0047c45d: 33db                 xor ebx, ebx
0047c45f: 8a9844c54700         mov bl, byte ptr [eax + 0x47c544]
0047c465: ff249d28c54700       jmp dword ptr [ebx*4 + 0x47c528]
0047c46c: 80790c00             cmp byte ptr [ecx + 0xc], 0
0047c470: 751c                 jne 0x47c48e
0047c472: eb18                 jmp 0x47c48c
0047c474: 810d61c6890000080000 or dword ptr [0x89c661], 0x800
0047c47e: 810d61c6890000008000 or dword ptr [0x89c661], 0x800000
0047c488: b201                 mov dl, 1
0047c48a: eb02                 jmp 0x47c48e
0047c48c: b201                 mov dl, 1
0047c48e: 84d2                 test dl, dl
0047c490: 7413                 je 0x47c4a5
0047c492: c6410c46             mov byte ptr [ecx + 0xc], 0x46
0047c496: 0fbe44240c           movsx eax, byte ptr [esp + 0xc]
0047c49b: 894104               mov dword ptr [ecx + 4], eax
0047c49e: c7410800000000       mov dword ptr [ecx + 8], 0
0047c4a5: 807c240c00           cmp byte ptr [esp + 0xc], 0
0047c4aa: 7e12                 jle 0x47c4be
0047c4ac: 0fbe44240c           movsx eax, byte ptr [esp + 0xc]
0047c4b1: 0567d18900           add eax, 0x89d167
0047c4b6: 8038ff               cmp byte ptr [eax], 0xff
0047c4b9: 7403                 je 0x47c4be
0047c4bb: c60006               mov byte ptr [eax], 6
0047c4be: 5e                   pop esi
0047c4bf: 5b                   pop ebx
0047c4c0: c3                   ret 
