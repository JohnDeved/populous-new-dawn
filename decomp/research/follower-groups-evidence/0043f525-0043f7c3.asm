0043f525: 8b8424e4030000       mov eax, dword ptr [esp + 0x3e4]
0043f52c: be01000000           mov esi, 1
0043f531: 8b9081080000         mov edx, dword ptr [eax + 0x881]
0043f537: 8b8424e8030000       mov eax, dword ptr [esp + 0x3e8]
0043f53e: 8a4804               mov cl, byte ptr [eax + 4]
0043f541: d3e6                 shl esi, cl
0043f543: 85d2                 test edx, edx
0043f545: 0f84492d0000         je 0x442294
0043f54b: 8a427a               mov al, byte ptr [edx + 0x7a]
0043f54e: a880                 test al, 0x80
0043f550: 740b                 je 0x43f55d
0043f552: 0c01                 or al, 1
0043f554: 8bce                 mov ecx, esi
0043f556: 0ac8                 or cl, al
0043f558: 88427a               mov byte ptr [edx + 0x7a], al
0043f55b: eb06                 jmp 0x43f563
0043f55d: 8bce                 mov ecx, esi
0043f55f: f6d1                 not cl
0043f561: 22c8                 and cl, al
0043f563: 884a7a               mov byte ptr [edx + 0x7a], cl
0043f566: 8b5208               mov edx, dword ptr [edx + 8]
0043f569: 85d2                 test edx, edx
0043f56b: 75de                 jne 0x43f54b
0043f56d: e9222d0000           jmp 0x442294
0043f572: 8b8424e4030000       mov eax, dword ptr [esp + 0x3e4]
0043f579: ba01000000           mov edx, 1
0043f57e: c644241300           mov byte ptr [esp + 0x13], 0
0043f583: 8b8881080000         mov ecx, dword ptr [eax + 0x881]
0043f589: 8b8424e8030000       mov eax, dword ptr [esp + 0x3e8]
0043f590: 894c2430             mov dword ptr [esp + 0x30], ecx
0043f594: c784248401000000000000 mov dword ptr [esp + 0x184], 0
0043f59f: 8a4804               mov cl, byte ptr [eax + 4]
0043f5a2: d3e2                 shl edx, cl
0043f5a4: 89942484000000       mov dword ptr [esp + 0x84], edx
0043f5ab: 837c243000           cmp dword ptr [esp + 0x30], 0
0043f5b0: 0f84d3010000         je 0x43f789
0043f5b6: 33c9                 xor ecx, ecx
0043f5b8: 8b442430             mov eax, dword ptr [esp + 0x30]
0043f5bc: 8a487a               mov cl, byte ptr [eax + 0x7a]
0043f5bf: 858c2484000000       test dword ptr [esp + 0x84], ecx
0043f5c6: 0f84aa010000         je 0x43f776
0043f5cc: 6a01                 push 1
0043f5ce: 50                   push eax
0043f5cf: e85c3e0a00           call 0x4e3430
0043f5d4: 83c408               add esp, 8
0043f5d7: 84c0                 test al, al
0043f5d9: 0f8497010000         je 0x43f776
0043f5df: 807c241300           cmp byte ptr [esp + 0x13], 0
0043f5e4: 0f85d2000000         jne 0x43f6bc
0043f5ea: 8b8424e8030000       mov eax, dword ptr [esp + 0x3e8]
0043f5f1: c644241301           mov byte ptr [esp + 0x13], 1
0043f5f6: 83780800             cmp dword ptr [eax + 8], 0
0043f5fa: 0f84bc000000         je 0x43f6bc
0043f600: 8b8424e4030000       mov eax, dword ptr [esp + 0x3e4]
0043f607: 8bb081080000         mov esi, dword ptr [eax + 0x881]
0043f60d: 85f6                 test esi, esi
0043f60f: 0f84a7000000         je 0x43f6bc
0043f615: bb01000000           mov ebx, 1
0043f61a: 6a00                 push 0
0043f61c: 6a00                 push 0
0043f61e: 56                   push esi
0043f61f: e8ac620000           call 0x4458d0
0043f624: 668b869f000000       mov ax, word ptr [esi + 0x9f]
0043f62b: 83c40c               add esp, 0xc
0043f62e: 6685c0               test ax, ax
0043f631: 747e                 je 0x43f6b1
0043f633: 0fb7c0               movzx eax, ax
0043f636: 33ff                 xor edi, edi
0043f638: 8b048590038900       mov eax, dword ptr [eax*4 + 0x890390]
0043f63f: 85580c               test dword ptr [eax + 0xc], ebx
0043f642: 7508                 jne 0x43f64c
0043f644: 80782a00             cmp byte ptr [eax + 0x2a], 0
0043f648: 7402                 je 0x43f64c
0043f64a: 8bf8                 mov edi, eax
0043f64c: 85ff                 test edi, edi
0043f64e: 7461                 je 0x43f6b1
0043f650: 80bf9e00000000       cmp byte ptr [edi + 0x9e], 0
0043f657: 7458                 je 0x43f6b1
0043f659: 33c0                 xor eax, eax
0043f65b: 8a472b               mov al, byte ptr [edi + 0x2b]
0043f65e: 8bc8                 mov ecx, eax
0043f660: 8d0440               lea eax, [eax + eax*2]
0043f663: c1e003               shl eax, 3
0043f666: 2bc1                 sub eax, ecx
0043f668: 0fbea840795a00       movsx ebp, byte ptr [eax + 0x5a7940]
0043f66f: 85ed                 test ebp, ebp
0043f671: 7e3e                 jle 0x43f6b1
0043f673: 83c77a               add edi, 0x7a
0043f676: 668b07               mov ax, word ptr [edi]
0043f679: 33c9                 xor ecx, ecx
0043f67b: 663bc1               cmp ax, cx
0043f67e: 7416                 je 0x43f696
0043f680: 0fb7c0               movzx eax, ax
0043f683: 8b048590038900       mov eax, dword ptr [eax*4 + 0x890390]
0043f68a: 85580c               test dword ptr [eax + 0xc], ebx
0043f68d: 7507                 jne 0x43f696
0043f68f: 38482a               cmp byte ptr [eax + 0x2a], cl
0043f692: 7402                 je 0x43f696
0043f694: 8bc8                 mov ecx, eax
0043f696: 85c9                 test ecx, ecx
0043f698: 7411                 je 0x43f6ab
0043f69a: 3bf1                 cmp esi, ecx
0043f69c: 740d                 je 0x43f6ab
0043f69e: 6a00                 push 0
0043f6a0: 6a00                 push 0
0043f6a2: 51                   push ecx
0043f6a3: e828620000           call 0x4458d0
0043f6a8: 83c40c               add esp, 0xc
0043f6ab: 83c702               add edi, 2
0043f6ae: 4d                   dec ebp
0043f6af: 75c5                 jne 0x43f676
0043f6b1: 8b7608               mov esi, dword ptr [esi + 8]
0043f6b4: 85f6                 test esi, esi
0043f6b6: 0f855effffff         jne 0x43f61a
0043f6bc: 8b442430             mov eax, dword ptr [esp + 0x30]
0043f6c0: 6a00                 push 0
0043f6c2: 6a01                 push 1
0043f6c4: 50                   push eax
0043f6c5: e806620000           call 0x4458d0
0043f6ca: 8b44243c             mov eax, dword ptr [esp + 0x3c]
0043f6ce: 83c40c               add esp, 0xc
0043f6d1: 668b809f000000       mov ax, word ptr [eax + 0x9f]
0043f6d8: 6685c0               test ax, ax
0043f6db: 0f8486000000         je 0x43f767
0043f6e1: 0fb7c0               movzx eax, ax
0043f6e4: 33f6                 xor esi, esi
0043f6e6: 8b048590038900       mov eax, dword ptr [eax*4 + 0x890390]
0043f6ed: f6400c01             test byte ptr [eax + 0xc], 1
0043f6f1: 7508                 jne 0x43f6fb
0043f6f3: 80782a00             cmp byte ptr [eax + 0x2a], 0
0043f6f7: 7402                 je 0x43f6fb
0043f6f9: 8bf0                 mov esi, eax
0043f6fb: 85f6                 test esi, esi
0043f6fd: 7468                 je 0x43f767
0043f6ff: 80be9e00000000       cmp byte ptr [esi + 0x9e], 0
0043f706: 745f                 je 0x43f767
0043f708: 33c9                 xor ecx, ecx
0043f70a: 8a4e2b               mov cl, byte ptr [esi + 0x2b]
0043f70d: 8bc1                 mov eax, ecx
0043f70f: 8d0c49               lea ecx, [ecx + ecx*2]
0043f712: c1e103               shl ecx, 3
0043f715: 2bc8                 sub ecx, eax
0043f717: 0fbeb940795a00       movsx edi, byte ptr [ecx + 0x5a7940]
0043f71e: 85ff                 test edi, edi
0043f720: 7e45                 jle 0x43f767
0043f722: 83c67a               add esi, 0x7a
0043f725: bd01000000           mov ebp, 1
0043f72a: 33db                 xor ebx, ebx
0043f72c: 668b06               mov ax, word ptr [esi]
0043f72f: 33c9                 xor ecx, ecx
0043f731: 663bc1               cmp ax, cx
0043f734: 7416                 je 0x43f74c
0043f736: 0fb7c0               movzx eax, ax
0043f739: 8b048590038900       mov eax, dword ptr [eax*4 + 0x890390]
0043f740: 85680c               test dword ptr [eax + 0xc], ebp
0043f743: 7507                 jne 0x43f74c
0043f745: 38582a               cmp byte ptr [eax + 0x2a], bl
0043f748: 7402                 je 0x43f74c
0043f74a: 8bc8                 mov ecx, eax
0043f74c: 85c9                 test ecx, ecx
0043f74e: 7411                 je 0x43f761
0043f750: 394c2430             cmp dword ptr [esp + 0x30], ecx
0043f754: 740b                 je 0x43f761
0043f756: 53                   push ebx
0043f757: 55                   push ebp
0043f758: 51                   push ecx
0043f759: e872610000           call 0x4458d0
0043f75e: 83c40c               add esp, 0xc
0043f761: 83c602               add esi, 2
0043f764: 4f                   dec edi
0043f765: 75c5                 jne 0x43f72c
0043f767: ff842484010000       inc dword ptr [esp + 0x184]
0043f76e: 8b442430             mov eax, dword ptr [esp + 0x30]
0043f772: 89442420             mov dword ptr [esp + 0x20], eax
0043f776: 8b442430             mov eax, dword ptr [esp + 0x30]
0043f77a: 8b4808               mov ecx, dword ptr [eax + 8]
0043f77d: 894c2430             mov dword ptr [esp + 0x30], ecx
0043f781: 85c9                 test ecx, ecx
0043f783: 0f852dfeffff         jne 0x43f5b6
0043f789: 83bc248401000000     cmp dword ptr [esp + 0x184], 0
0043f791: 0f84fd2a0000         je 0x442294
0043f797: 0fbe05f0c68900       movsx eax, byte ptr [0x89c6f0]
0043f79e: 33c9                 xor ecx, ecx
0043f7a0: 8a4c2414             mov cl, byte ptr [esp + 0x14]
0043f7a4: 3bc1                 cmp eax, ecx
0043f7a6: 0f85e82a0000         jne 0x442294
0043f7ac: 8b8424e4030000       mov eax, dword ptr [esp + 0x3e4]
0043f7b3: 50                   push eax
0043f7b4: 6a0c                 push 0xc
0043f7b6: e895ad0300           call 0x47a550
0043f7bb: 83c408               add esp, 8
0043f7be: e9d12a0000           jmp 0x442294
