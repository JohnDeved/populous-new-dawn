00433490 83ec0c               sub esp, 0xc
00433493 56                   push esi
00433494 8b742414             mov esi, dword ptr [esp + 0x14]
00433498 8b463d               mov eax, dword ptr [esi + 0x3d]
0043349b 89442408             mov dword ptr [esp + 8], eax
0043349f 8b4c2418             mov ecx, dword ptr [esp + 0x18]
004334a3 85c9                 test ecx, ecx
004334a5 0f846c010000         je 0x433617
004334ab 33d2                 xor edx, edx
004334ad 8a11                 mov dl, byte ptr [ecx]
004334af 8bc2                 mov eax, edx
004334b1 8d1492               lea edx, [edx + edx*4]
004334b4 8d1450               lea edx, [eax + edx*2]
004334b7 8b0455ca7d5a00       mov eax, dword ptr [edx*2 + 0x5a7dca]
004334be f6c401               test ah, 1
004334c1 0f85e8010000         jne 0x4336af
004334c7 a820                 test al, 0x20
004334c9 0f84ab000000         je 0x43357a
004334cf 8d442408             lea eax, [esp + 8]
004334d3 50                   push eax
004334d4 51                   push ecx
004334d5 e8e6540000           call 0x4389c0
004334da 668b4c2412           mov cx, word ptr [esp + 0x12]
004334df 8b442410             mov eax, dword ptr [esp + 0x10]
004334e3 89442414             mov dword ptr [esp + 0x14], eax
004334e7 83c408               add esp, 8
004334ea 88642406             mov byte ptr [esp + 6], ah
004334ee 33c0                 xor eax, eax
004334f0 886c2407             mov byte ptr [esp + 7], ch
004334f4 33c9                 xor ecx, ecx
004334f6 668b442406           mov ax, word ptr [esp + 6]
004334fb 668b4c2406           mov cx, word ptr [esp + 6]
00433500 25fe000000           and eax, 0xfe
00433505 03c0                 add eax, eax
00433507 81e100fe0000         and ecx, 0xfe00
0043350d 0bc1                 or eax, ecx
0043350f 8d0c85e4038a00       lea ecx, [eax*4 + 0x8a03e4]
00433516 f6410102             test byte ptr [ecx + 1], 2
0043351a 7420                 je 0x43353c
0043351c 8d44240c             lea eax, [esp + 0xc]
00433520 50                   push eax
00433521 33c0                 xor eax, eax
00433523 668b4108             mov ax, word ptr [ecx + 8]
00433527 25ff030000           and eax, 0x3ff
0043352c 8b0c8590038900       mov ecx, dword ptr [eax*4 + 0x890390]
00433533 51                   push ecx
00433534 e8770ffdff           call 0x4044b0
00433539 83c408               add esp, 8
0043353c 8b44240c             mov eax, dword ptr [esp + 0xc]
00433540 894668               mov dword ptr [esi + 0x68], eax
00433543 662500fe             and ax, 0xfe00
00433547 66050001             add ax, 0x100
0043354b 66894668             mov word ptr [esi + 0x68], ax
0043354f 668b466a             mov ax, word ptr [esi + 0x6a]
00433553 662500fe             and ax, 0xfe00
00433557 66050001             add ax, 0x100
0043355b 6689466a             mov word ptr [esi + 0x6a], ax
0043355f 8a8682000000         mov al, byte ptr [esi + 0x82]
00433565 24f0                 and al, 0xf0
00433567 888682000000         mov byte ptr [esi + 0x82], al
0043356d 240f                 and al, 0xf
0043356f 888682000000         mov byte ptr [esi + 0x82], al
00433575 5e                   pop esi
00433576 83c40c               add esp, 0xc
00433579 c3                   ret 
0043357a 668b4c240a           mov cx, word ptr [esp + 0xa]
0043357f 8b442408             mov eax, dword ptr [esp + 8]
00433583 8944240c             mov dword ptr [esp + 0xc], eax
00433587 88642406             mov byte ptr [esp + 6], ah
0043358b 33c0                 xor eax, eax
0043358d 886c2407             mov byte ptr [esp + 7], ch
00433591 668b442406           mov ax, word ptr [esp + 6]
00433596 33c9                 xor ecx, ecx
00433598 668b4c2406           mov cx, word ptr [esp + 6]
0043359d 25fe000000           and eax, 0xfe
004335a2 03c0                 add eax, eax
004335a4 81e100fe0000         and ecx, 0xfe00
004335aa 0bc1                 or eax, ecx
004335ac 8d0c85e4038a00       lea ecx, [eax*4 + 0x8a03e4]
004335b3 f6410102             test byte ptr [ecx + 1], 2
004335b7 7420                 je 0x4335d9
004335b9 8d44240c             lea eax, [esp + 0xc]
004335bd 50                   push eax
004335be 33c0                 xor eax, eax
004335c0 668b4108             mov ax, word ptr [ecx + 8]
004335c4 25ff030000           and eax, 0x3ff
004335c9 8b0c8590038900       mov ecx, dword ptr [eax*4 + 0x890390]
004335d0 51                   push ecx
004335d1 e8da0efdff           call 0x4044b0
004335d6 83c408               add esp, 8
004335d9 8b44240c             mov eax, dword ptr [esp + 0xc]
004335dd 894668               mov dword ptr [esi + 0x68], eax
004335e0 662500fe             and ax, 0xfe00
004335e4 66050001             add ax, 0x100
004335e8 66894668             mov word ptr [esi + 0x68], ax
004335ec 668b466a             mov ax, word ptr [esi + 0x6a]
004335f0 662500fe             and ax, 0xfe00
004335f4 66050001             add ax, 0x100
004335f8 6689466a             mov word ptr [esi + 0x6a], ax
004335fc 8a8682000000         mov al, byte ptr [esi + 0x82]
00433602 24f0                 and al, 0xf0
00433604 888682000000         mov byte ptr [esi + 0x82], al
0043360a 240f                 and al, 0xf
0043360c 888682000000         mov byte ptr [esi + 0x82], al
00433612 5e                   pop esi
00433613 83c40c               add esp, 0xc
00433616 c3                   ret 
00433617 668b4c240a           mov cx, word ptr [esp + 0xa]
0043361c 8b442408             mov eax, dword ptr [esp + 8]
00433620 8944240c             mov dword ptr [esp + 0xc], eax
00433624 88642406             mov byte ptr [esp + 6], ah
00433628 33c0                 xor eax, eax
0043362a 886c2407             mov byte ptr [esp + 7], ch
0043362e 668b442406           mov ax, word ptr [esp + 6]
00433633 33c9                 xor ecx, ecx
00433635 668b4c2406           mov cx, word ptr [esp + 6]
0043363a 25fe000000           and eax, 0xfe
0043363f 03c0                 add eax, eax
00433641 81e100fe0000         and ecx, 0xfe00
00433647 0bc1                 or eax, ecx
00433649 8d0c85e4038a00       lea ecx, [eax*4 + 0x8a03e4]
00433650 f6410102             test byte ptr [ecx + 1], 2
00433654 7420                 je 0x433676
00433656 8d44240c             lea eax, [esp + 0xc]
0043365a 50                   push eax
0043365b 33c0                 xor eax, eax
0043365d 668b4108             mov ax, word ptr [ecx + 8]
00433661 25ff030000           and eax, 0x3ff
00433666 8b0c8590038900       mov ecx, dword ptr [eax*4 + 0x890390]
0043366d 51                   push ecx
0043366e e83d0efdff           call 0x4044b0
00433673 83c408               add esp, 8
00433676 8b44240c             mov eax, dword ptr [esp + 0xc]
0043367a 894668               mov dword ptr [esi + 0x68], eax
0043367d 662500fe             and ax, 0xfe00
00433681 66050001             add ax, 0x100
00433685 66894668             mov word ptr [esi + 0x68], ax
00433689 668b466a             mov ax, word ptr [esi + 0x6a]
0043368d 662500fe             and ax, 0xfe00
00433691 66050001             add ax, 0x100
00433695 6689466a             mov word ptr [esi + 0x6a], ax
00433699 8a8682000000         mov al, byte ptr [esi + 0x82]
0043369f 24f0                 and al, 0xf0
004336a1 888682000000         mov byte ptr [esi + 0x82], al
004336a7 240f                 and al, 0xf
004336a9 888682000000         mov byte ptr [esi + 0x82], al
004336af 5e                   pop esi
004336b0 83c40c               add esp, 0xc
004336b3 c3                   ret 
