0046960a: 0f8495010000         je 0x4697a5
00469610: a1f0cb8700           mov eax, dword ptr [0x87cbf0]
00469615: 50                   push eax
00469616: e8c52c0000           call 0x46c2e0
0046961b: 50                   push eax
0046961c: e80fd70a00           call 0x516d30
00469621: 8b7c2424             mov edi, dword ptr [esp + 0x24]
00469625: 83c408               add esp, 8
00469628: 6a41                 push 0x41
0046962a: e8e12c0000           call 0x46c310
0046962f: 83c404               add esp, 4
00469632: 2bf8                 sub edi, eax
00469634: f644246c80           test byte ptr [esp + 0x6c], 0x80
00469639: 7412                 je 0x46964d
0046963b: 8bc6                 mov eax, esi
0046963d: c1e005               shl eax, 5
00469640: 99                   cdq 
00469641: 83e21f               and edx, 0x1f
00469644: 03c2                 add eax, edx
00469646: c1f805               sar eax, 5
00469649: 2bf8                 sub edi, eax
0046964b: eb13                 jmp 0x469660
0046964d: 8d0476               lea eax, [esi + esi*2]
00469650: c1e003               shl eax, 3
00469653: f7d8                 neg eax
00469655: 99                   cdq 
00469656: 83e21f               and edx, 0x1f
00469659: 03c2                 add eax, edx
0046965b: c1f805               sar eax, 5
0046965e: 03f8                 add edi, eax
00469660: 8b742418             mov esi, dword ptr [esp + 0x18]
00469664: 6a41                 push 0x41
00469666: 33ed                 xor ebp, ebp
00469668: e8832c0000           call 0x46c2f0
0046966d: 99                   cdq 
0046966e: 83c404               add esp, 4
00469671: 2bc2                 sub eax, edx
00469673: c1f801               sar eax, 1
00469676: 2bf0                 sub esi, eax
00469678: 85db                 test ebx, ebx
0046967a: 0f8e25010000         jle 0x4697a5
00469680: 8b442444             mov eax, dword ptr [esp + 0x44]
00469684: 8d8c80c8895a00       lea ecx, [eax + eax*4 + 0x5a89c8]
0046968b: 898c2458020000       mov dword ptr [esp + 0x258], ecx
00469692: 33c0                 xor eax, eax
00469694: 8d4c2412             lea ecx, [esp + 0x12]
00469698: 8a842cc0020000       mov al, byte ptr [esp + ebp + 0x2c0]
0046969f: 50                   push eax
004696a0: 6818da5900           push 0x59da18
004696a5: 51                   push ecx
004696a6: e8a51d0f00           call 0x55b450
004696ab: 8d4c241e             lea ecx, [esp + 0x1e]
004696af: 8d9424ac000000       lea edx, [esp + 0xac]
004696b6: 83c40c               add esp, 0xc
004696b9: 51                   push ecx
004696ba: 52                   push edx
004696bb: e8b00f0300           call 0x49a670
004696c0: 83c408               add esp, 8
004696c3: 8a0df5c68900         mov cl, byte ptr [0x89c6f5]
004696c9: 880d9c489800         mov byte ptr [0x98489c], cl
004696cf: e83c9b0200           call 0x493210
004696d4: 85c0                 test eax, eax
004696d6: 741a                 je 0x4696f2
004696d8: a09c489800           mov al, byte ptr [0x98489c]
004696dd: 8d8c24a0000000       lea ecx, [esp + 0xa0]
004696e4: 50                   push eax
004696e5: 51                   push ecx
004696e6: 57                   push edi
004696e7: 56                   push esi
004696e8: e8b384feff           call 0x451ba0
004696ed: 83c410               add esp, 0x10
004696f0: eb2e                 jmp 0x469720
004696f2: 83ec08               sub esp, 8
004696f5: a09c489800           mov al, byte ptr [0x98489c]
004696fa: 89a42464020000       mov dword ptr [esp + 0x264], esp
00469701: 50                   push eax
00469702: 8b8c2468020000       mov ecx, dword ptr [esp + 0x268]
00469709: e862c8faff           call 0x415f70
0046970e: 8d8424a8000000       lea eax, [esp + 0xa8]
00469715: 50                   push eax
00469716: 57                   push edi
00469717: 56                   push esi
00469718: e843e20b00           call 0x527960
0046971d: 83c414               add esp, 0x14
00469720: 8b842458020000       mov eax, dword ptr [esp + 0x258]
00469727: 8a00                 mov al, byte ptr [eax]
00469729: a29c489800           mov byte ptr [0x98489c], al
0046972e: e8dd9a0200           call 0x493210
00469733: 85c0                 test eax, eax
00469735: 741a                 je 0x469751
00469737: a09c489800           mov al, byte ptr [0x98489c]
0046973c: 8d8c24a0000000       lea ecx, [esp + 0xa0]
00469743: 50                   push eax
00469744: 51                   push ecx
00469745: 57                   push edi
00469746: 56                   push esi
00469747: e85484feff           call 0x451ba0
0046974c: 83c410               add esp, 0x10
0046974f: eb2e                 jmp 0x46977f
00469751: 83ec08               sub esp, 8
00469754: a09c489800           mov al, byte ptr [0x98489c]
00469759: 89a4245c020000       mov dword ptr [esp + 0x25c], esp
00469760: 50                   push eax
00469761: 8b8c2460020000       mov ecx, dword ptr [esp + 0x260]
00469768: e803c8faff           call 0x415f70
0046976d: 8d8424a8000000       lea eax, [esp + 0xa8]
00469774: 50                   push eax
00469775: 57                   push edi
00469776: 56                   push esi
00469777: e8e4e10b00           call 0x527960
0046977c: 83c414               add esp, 0x14
0046977f: 45                   inc ebp
00469780: 6a41                 push 0x41
00469782: e8892b0000           call 0x46c310
00469787: 83c404               add esp, 4
0046978a: 8d0440               lea eax, [eax + eax*2]
0046978d: c1e003               shl eax, 3
00469790: f7d8                 neg eax
00469792: 99                   cdq 
00469793: 83e21f               and edx, 0x1f
00469796: 03c2                 add eax, edx
00469798: c1f805               sar eax, 5
0046979b: 03f8                 add edi, eax
0046979d: 3beb                 cmp ebp, ebx
0046979f: 0f8cedfeffff         jl 0x469692
