0043daa0 83ec08               sub esp, 8
0043daa3 32c0                 xor al, al
0043daa5 53                   push ebx
0043daa6 56                   push esi
0043daa7 57                   push edi
0043daa8 33db                 xor ebx, ebx
0043daaa 33f6                 xor esi, esi
0043daac 8b7c2418             mov edi, dword ptr [esp + 0x18]
0043dab0 668b4f72             mov cx, word ptr [edi + 0x72]
0043dab4 885c240f             mov byte ptr [esp + 0xf], bl
0043dab8 663bcb               cmp cx, bx
0043dabb 7417                 je 0x43dad4
0043dabd 0fb7c9               movzx ecx, cx
0043dac0 8b0c8d90038900       mov ecx, dword ptr [ecx*4 + 0x890390]
0043dac7 f6410c01             test byte ptr [ecx + 0xc], 1
0043dacb 7507                 jne 0x43dad4
0043dacd 38592a               cmp byte ptr [ecx + 0x2a], bl
0043dad0 7402                 je 0x43dad4
0043dad2 8bf1                 mov esi, ecx
0043dad4 85f6                 test esi, esi
0043dad6 0f8432010000         je 0x43dc0e
0043dadc 6683be9f00000000     cmp word ptr [esi + 0x9f], 0
0043dae4 0f8519010000         jne 0x43dc03
0043daea 8a4f2d               mov cl, byte ptr [edi + 0x2d]
0043daed 84c9                 test cl, cl
0043daef 740a                 je 0x43dafb
0043daf1 f6472e03             test byte ptr [edi + 0x2e], 3
0043daf5 7512                 jne 0x43db09
0043daf7 b001                 mov al, 1
0043daf9 eb0e                 jmp 0x43db09
0043dafb b801000000           mov eax, 1
0043db00 02c8                 add cl, al
0043db02 8844240f             mov byte ptr [esp + 0xf], al
0043db06 884f2d               mov byte ptr [edi + 0x2d], cl
0043db09 84c0                 test al, al
0043db0b 0f84ff000000         je 0x43dc10
0043db11 814f0c00000002       or dword ptr [edi + 0xc], 0x2000000
0043db18 66816776f7ff         and word ptr [edi + 0x76], 0xfff7
0043db1e 6a00                 push 0
0043db20 56                   push esi
0043db21 e8cac8fcff           call 0x40a3f0
0043db26 83c408               add esp, 8
0043db29 85c0                 test eax, eax
0043db2b 7410                 je 0x43db3d
0043db2d 8d4c2410             lea ecx, [esp + 0x10]
0043db31 51                   push ecx
0043db32 50                   push eax
0043db33 e87869fcff           call 0x4044b0
0043db38 83c408               add esp, 8
0043db3b eb07                 jmp 0x43db44
0043db3d 8b463d               mov eax, dword ptr [esi + 0x3d]
0043db40 89442410             mov dword ptr [esp + 0x10], eax
0043db44 807c240f00           cmp byte ptr [esp + 0xf], 0
0043db49 0f8594000000         jne 0x43dbe3
0043db4f 0fbf742410           movsx esi, word ptr [esp + 0x10]
0043db54 0fbf4f3d             movsx ecx, word ptr [edi + 0x3d]
0043db58 8bc6                 mov eax, esi
0043db5a 2bc1                 sub eax, ecx
0043db5c 99                   cdq 
0043db5d 33c2                 xor eax, edx
0043db5f 2bc2                 sub eax, edx
0043db61 3d38030000           cmp eax, 0x338
0043db66 7d27                 jge 0x43db8f
0043db68 0fbf442412           movsx eax, word ptr [esp + 0x12]
0043db6d 0fbf4f3f             movsx ecx, word ptr [edi + 0x3f]
0043db71 2bc1                 sub eax, ecx
0043db73 99                   cdq 
0043db74 33c2                 xor eax, edx
0043db76 2bc2                 sub eax, edx
0043db78 3d38030000           cmp eax, 0x338
0043db7d 7d10                 jge 0x43db8f
0043db7f 81670cfffffffd       and dword ptr [edi + 0xc], 0xfdffffff
0043db86 8ac3                 mov al, bl
0043db88 5f                   pop edi
0043db89 5e                   pop esi
0043db8a 5b                   pop ebx
0043db8b 83c408               add esp, 8
0043db8e c3                   ret 
0043db8f 804f7608             or byte ptr [edi + 0x76], 8
0043db93 0fbf474f             movsx eax, word ptr [edi + 0x4f]
0043db97 2bc6                 sub eax, esi
0043db99 99                   cdq 
0043db9a 33c2                 xor eax, edx
0043db9c 2bc2                 sub eax, edx
0043db9e 3db8010000           cmp eax, 0x1b8
0043dba3 7d17                 jge 0x43dbbc
0043dba5 0fbf4751             movsx eax, word ptr [edi + 0x51]
0043dba9 0fbf4c2412           movsx ecx, word ptr [esp + 0x12]
0043dbae 2bc1                 sub eax, ecx
0043dbb0 99                   cdq 
0043dbb1 33c2                 xor eax, edx
0043dbb3 2bc2                 sub eax, edx
0043dbb5 3db8010000           cmp eax, 0x1b8
0043dbba 7c0e                 jl 0x43dbca
0043dbbc 8d442410             lea eax, [esp + 0x10]
0043dbc0 50                   push eax
0043dbc1 57                   push edi
0043dbc2 e8b9c10a00           call 0x4e9d80
0043dbc7 83c408               add esp, 8
0043dbca 66837f5f00           cmp word ptr [edi + 0x5f], 0
0043dbcf 753f                 jne 0x43dc10
0043dbd1 57                   push edi
0043dbd2 e869730900           call 0x4d4f40
0043dbd7 83c404               add esp, 4
0043dbda 8ac3                 mov al, bl
0043dbdc 5f                   pop edi
0043dbdd 5e                   pop esi
0043dbde 5b                   pop ebx
0043dbdf 83c408               add esp, 8
0043dbe2 c3                   ret 
0043dbe3 57                   push edi
0043dbe4 e857730900           call 0x4d4f40
0043dbe9 8d442414             lea eax, [esp + 0x14]
0043dbed 83c404               add esp, 4
0043dbf0 50                   push eax
0043dbf1 57                   push edi
0043dbf2 e889c10a00           call 0x4e9d80
0043dbf7 83c408               add esp, 8
0043dbfa 8ac3                 mov al, bl
0043dbfc 5f                   pop edi
0043dbfd 5e                   pop esi
0043dbfe 5b                   pop ebx
0043dbff 83c408               add esp, 8
0043dc02 c3                   ret 
0043dc03 b301                 mov bl, 1
0043dc05 5f                   pop edi
0043dc06 8ac3                 mov al, bl
0043dc08 5e                   pop esi
0043dc09 5b                   pop ebx
0043dc0a 83c408               add esp, 8
0043dc0d c3                   ret 
0043dc0e b301                 mov bl, 1
0043dc10 8ac3                 mov al, bl
0043dc12 5f                   pop edi
0043dc13 5e                   pop esi
0043dc14 5b                   pop ebx
0043dc15 83c408               add esp, 8
0043dc18 c3                   ret 
