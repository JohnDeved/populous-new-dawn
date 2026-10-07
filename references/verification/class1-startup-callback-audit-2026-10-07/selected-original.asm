; fresh-header-wrapper: [0042c790,0042c8e7), SHA256 60256464f1922cc7659034e73c00d2ddeeba0129a78c10b61b4992ef52570142
0042c790 83ec08                   sub esp, 8
0042c793 0fbf05ddc68900           movsx eax, word ptr [0x89c6dd]
0042c79a 53                       push ebx
0042c79b 56                       push esi
0042c79c 57                       push edi
0042c79d 50                       push eax
0042c79e e8bd8e0500               call 0x485660
0042c7a3 83c404                   add esp, 4
0042c7a6 a099b78900               mov al, byte ptr [0x89b799]
0042c7ab a2c0ea9600               mov byte ptr [0x96eac0], al
0042c7b0 a2bfea9600               mov byte ptr [0x96eabf], al
0042c7b5 f60568c6890010           test byte ptr [0x89c668], 0x10
0042c7bc 7434                     je 0x42c7f2
0042c7be 0fbf05ddc68900           movsx eax, word ptr [0x89c6dd]
0042c7c5 50                       push eax
0042c7c6 e825960500               call 0x485df0
0042c7cb 83c404                   add esp, 4
0042c7ce 8bd8                     mov ebx, eax
0042c7d0 be41b78900               mov esi, 0x89b741
0042c7d5 bf0a079600               mov edi, 0x96070a
0042c7da 53                       push ebx
0042c7db e880960500               call 0x485e60
0042c7e0 83c404                   add esp, 4
0042c7e3 b90e000000               mov ecx, 0xe
0042c7e8 f3a5                     rep movsd dword ptr es:[edi], dword ptr [esi]
0042c7ea 881d3fb78900             mov byte ptr [0x89b73f], bl
0042c7f0 eb05                     jmp 0x42c7f7
0042c7f2 e869990500               call 0x486160
0042c7f7 33db                     xor ebx, ebx
0042c7f9 a0a2b78900               mov al, byte ptr [0x89b7a2]
0042c7fe 8a1da3b78900             mov bl, byte ptr [0x89b7a3]
0042c804 8a0da1b78900             mov cl, byte ptr [0x89b7a1]
0042c80a c744240c00000000         mov dword ptr [esp + 0xc], 0
0042c812 c744241000000000         mov dword ptr [esp + 0x10], 0
0042c81a bfd3798900               mov edi, 0x8979d3
0042c81f 8844240c                 mov byte ptr [esp + 0xc], al
0042c823 884c2410                 mov byte ptr [esp + 0x10], cl
0042c827 e874f7ffff               call 0x42bfa0
0042c82c e8ef600700               call 0x4a2920
0042c831 e80a48fdff               call 0x401040
0042c836 e8f5310200               call 0x44fa30
0042c83b 33c0                     xor eax, eax
0042c83d b9e2050000               mov ecx, 0x5e2
0042c842 f3ab                     rep stosd dword ptr es:[edi], eax
0042c844 a384d18900               mov dword ptr [0x89d184], eax
0042c849 e8e2e30400               call 0x47ac30
0042c84e bfa0f46400               mov edi, 0x64f4a0
0042c853 e8c81a0100               call 0x43e320
0042c858 e893efffff               call 0x42b7f0
0042c85d c605bb5e890000           mov byte ptr [0x895ebb], 0
0042c864 33c0                     xor eax, eax
0042c866 b9cf070000               mov ecx, 0x7cf
0042c86b c605bc5e890000           mov byte ptr [0x895ebc], 0
0042c872 66c70578aa96000100       mov word ptr [0x96aa78], 1
0042c87b 66c7057aaa96000000       mov word ptr [0x96aa7a], 0
0042c884 f3ab                     rep stosd dword ptr es:[edi], eax
0042c886 aa                       stosb byte ptr es:[edi], al
0042c887 bfbaaa9600               mov edi, 0x96aaba
0042c88c b900080000               mov ecx, 0x800
0042c891 f3ab                     rep stosd dword ptr es:[edi], eax
0042c893 bfbaca9600               mov edi, 0x96caba
0042c898 b900080000               mov ecx, 0x800
0042c89d f3ab                     rep stosd dword ptr es:[edi], eax
0042c89f b8c8000000               mov eax, 0xc8
0042c8a4 53                       push ebx
0042c8a5 8b4c2410                 mov ecx, dword ptr [esp + 0x10]
0042c8a9 a25cce8900               mov byte ptr [0x89ce5c], al
0042c8ae 8b542414                 mov edx, dword ptr [esp + 0x14]
0042c8b2 51                       push ecx
0042c8b3 52                       push edx
0042c8b4 a25ece8900               mov byte ptr [0x89ce5e], al
0042c8b9 c6055dce890000           mov byte ptr [0x89ce5d], 0
0042c8c0 c6055fce890000           mov byte ptr [0x89ce5f], 0
0042c8c7 e864e9ffff               call 0x42b230
0042c8cc 83c40c                   add esp, 0xc
0042c8cf 6a40                     push 0x40
0042c8d1 6a00                     push 0
0042c8d3 e868140900               call 0x4bdd40
0042c8d8 83c408                   add esp, 8
0042c8db e8f03dffff               call 0x4206d0
0042c8e0 5f                       pop edi
0042c8e1 5e                       pop esi
0042c8e2 5b                       pop ebx
0042c8e3 83c408                   add esp, 8
0042c8e6 c3                       ret
; class-seed-reset: [0042bfe7,0042bffe), SHA256 5d68e05ff17350f1cadda644b6042535d924cbb156fa829808592965c0598a18
0042bfe7 b8c1ea9600               mov eax, 0x96eac1
0042bfec bf10419700               mov edi, 0x974110
0042bff1 b914000000               mov ecx, 0x14
0042bff6 8918                     mov dword ptr [eax], ebx
0042bff8 895804                   mov dword ptr [eax + 4], ebx
0042bffb 895808                   mov dword ptr [eax + 8], ebx
; record-and-link-call-sites: [00484edc,00485122), SHA256 2a439e606bdfd870a9a973abca311823dd2a1158c6f545efaa6631414a17a3de
00484edc 381e                     cmp byte ptr [esi], bl
00484ede 0f8454010000             je 0x485038
00484ee4 668b4602                 mov ax, word ptr [esi + 2]
00484ee8 668944241c               mov word ptr [esp + 0x1c], ax
00484eed 33c0                     xor eax, eax
00484eef 668b4e04                 mov cx, word ptr [esi + 4]
00484ef3 a0bfea9600               mov al, byte ptr [0x96eabf]
00484ef8 66894c241e               mov word ptr [esp + 0x1e], cx
00484efd 66895c2420               mov word ptr [esp + 0x20], bx
00484f02 0fbe5601                 movsx edx, byte ptr [esi + 1]
00484f06 3bd0                     cmp edx, eax
00484f08 0f8d2a010000             jge 0x485038
00484f0e 803e07                   cmp byte ptr [esi], 7
00484f11 7509                     jne 0x484f1c
00484f13 807eff51                 cmp byte ptr [esi - 1], 0x51
00484f17 7503                     jne 0x484f1c
00484f19 885e01                   mov byte ptr [esi + 1], bl
00484f1c 803e06                   cmp byte ptr [esi], 6
00484f1f 7509                     jne 0x484f2a
00484f21 807eff06                 cmp byte ptr [esi - 1], 6
00484f25 7503                     jne 0x484f2a
00484f27 885e01                   mov byte ptr [esi + 1], bl
00484f2a 8a4e01                   mov cl, byte ptr [esi + 1]
00484f2d 80f9ff                   cmp cl, 0xff
00484f30 7407                     je 0x484f39
00484f32 0fbec1                   movsx eax, cl
00484f35 ff44842c                 inc dword ptr [esp + eax*4 + 0x2c]
00484f39 8a06                     mov al, byte ptr [esi]
00484f3b 3c03                     cmp al, 3
00484f3d 750d                     jne 0x484f4c
00484f3f f60561c6890008           test byte ptr [0x89c661], 8
00484f46 0f85ec000000             jne 0x485038
00484f4c 3c09                     cmp al, 9
00484f4e 0f84e4000000             je 0x485038
00484f54 3c06                     cmp al, 6
00484f56 750a                     jne 0x484f62
00484f58 807eff09                 cmp byte ptr [esi - 1], 9
00484f5c 0f84d6000000             je 0x485038
00484f62 3c07                     cmp al, 7
00484f64 750a                     jne 0x484f70
00484f66 807eff53                 cmp byte ptr [esi - 1], 0x53
00484f6a 0f84c8000000             je 0x485038
00484f70 3c02                     cmp al, 2
00484f72 7563                     jne 0x484fd7
00484f74 8b4606                   mov eax, dword ptr [esi + 6]
00484f77 8b0d43248900             mov ecx, dword ptr [0x892443]
00484f7d 99                       cdq
00484f7e 81e2ff010000             and edx, 0x1ff
00484f84 03c2                     add eax, edx
00484f86 c1f809                   sar eax, 9
00484f89 8901                     mov dword ptr [ecx], eax
00484f8b 8b0d43248900             mov ecx, dword ptr [0x892443]
00484f91 8d44241c                 lea eax, [esp + 0x1c]
00484f95 895904                   mov dword ptr [ecx + 4], ebx
00484f98 8b0d43248900             mov ecx, dword ptr [0x892443]
00484f9e 50                       push eax
00484f9f c7410802000000           mov dword ptr [ecx + 8], 2
00484fa6 8b0d43248900             mov ecx, dword ptr [0x892443]
00484fac c7410cffffffff           mov dword ptr [ecx + 0xc], 0xffffffff
00484fb3 8b0d43248900             mov ecx, dword ptr [0x892443]
00484fb9 895910                   mov dword ptr [ecx + 0x10], ebx
00484fbc 83054324890014           add dword ptr [0x892443], 0x14
00484fc3 c6053a24890001           mov byte ptr [0x89243a], 1
00484fca 8a5601                   mov dl, byte ptr [esi + 1]
00484fcd 8a4eff                   mov cl, byte ptr [esi - 1]
00484fd0 52                       push edx
00484fd1 8a06                     mov al, byte ptr [esi]
00484fd3 51                       push ecx
00484fd4 50                       push eax
00484fd5 eb3a                     jmp 0x485011
00484fd7 3c01                     cmp al, 1
00484fd9 7523                     jne 0x484ffe
00484fdb 807eff07                 cmp byte ptr [esi - 1], 7
00484fdf 750c                     jne 0x484fed
00484fe1 0fbec1                   movsx eax, cl
00484fe4 8a448440                 mov al, byte ptr [esp + eax*4 + 0x40]
00484fe8 884601                   mov byte ptr [esi + 1], al
00484feb eb11                     jmp 0x484ffe
00484fed f60561c6890008           test byte ptr [0x89c661], 8
00484ff4 7408                     je 0x484ffe
00484ff6 c64601ff                 mov byte ptr [esi + 1], 0xff
00484ffa c646ff01                 mov byte ptr [esi - 1], 1
00484ffe 8d46ff                   lea eax, [esi - 1]
00485001 8d4c241c                 lea ecx, [esp + 0x1c]
00485005 51                       push ecx
00485006 8a5601                   mov dl, byte ptr [esi + 1]
00485009 52                       push edx
0048500a 8a46ff                   mov al, byte ptr [esi - 1]
0048500d 50                       push eax
0048500e 8a0e                     mov cl, byte ptr [esi]
00485010 51                       push ecx
00485011 e88a880600               call 0x4ed8a0
00485016 83c410                   add esp, 0x10
00485019 8be8                     mov ebp, eax
0048501b 85ed                     test ebp, ebp
0048501d 7419                     je 0x485038
0048501f 385d2a                   cmp byte ptr [ebp + 0x2a], bl
00485022 7504                     jne 0x485028
00485024 c646ff03                 mov byte ptr [esi - 1], 3
00485028 8d46ff                   lea eax, [esi - 1]
0048502b 50                       push eax
0048502c 55                       push ebp
0048502d e8ce0a0000               call 0x485b00
00485032 83c408                   add esp, 8
00485035 897d08                   mov dword ptr [ebp + 8], edi
00485038 47                       inc edi
00485039 83c637                   add esi, 0x37
0048503c ff4c2424                 dec dword ptr [esp + 0x24]
00485040 0f8596feffff             jne 0x484edc
00485046 ff4c2428                 dec dword ptr [esp + 0x28]
0048504a 0f854afeffff             jne 0x484e9a
00485050 e88b010000               call 0x4851e0
00485055 a124038900               mov eax, dword ptr [0x890324]
0048505a 85c0                     test eax, eax
0048505c 740c                     je 0x48506a
0048505e 33c9                     xor ecx, ecx
00485060 894808                   mov dword ptr [eax + 8], ecx
00485063 8b4004                   mov eax, dword ptr [eax + 4]
00485066 85c0                     test eax, eax
00485068 75f6                     jne 0x485060
0048506a e831160000               call 0x4866a0
0048506f e8dc8e0600               call 0x4edf50
00485074 a124038900               mov eax, dword ptr [0x890324]
00485079 85c0                     test eax, eax
0048507b 740e                     je 0x48508b
0048507d 816010ffffffbf           and dword ptr [eax + 0x10], 0xbfffffff
00485084 8b4004                   mov eax, dword ptr [eax + 4]
00485087 85c0                     test eax, eax
00485089 75f2                     jne 0x48507d
0048508b 8b3524038900             mov esi, dword ptr [0x890324]
00485091 85f6                     test esi, esi
00485093 743d                     je 0x4850d2
00485095 b906000000               mov ecx, 6
0048509a 384e2a                   cmp byte ptr [esi + 0x2a], cl
0048509d 752c                     jne 0x4850cb
0048509f 384e2b                   cmp byte ptr [esi + 0x2b], cl
004850a2 7527                     jne 0x4850cb
004850a4 8d5672                   lea edx, [esi + 0x72]
004850a7 bf0a000000               mov edi, 0xa
004850ac 668b02                   mov ax, word ptr [edx]
004850af 6685c0                   test ax, ax
004850b2 7411                     je 0x4850c5
004850b4 0fb7c0                   movzx eax, ax
004850b7 8b1c8590038900           mov ebx, dword ptr [eax*4 + 0x890390]
004850be 814b1000000040           or dword ptr [ebx + 0x10], 0x40000000
004850c5 83c202                   add edx, 2
004850c8 4f                       dec edi
004850c9 75e1                     jne 0x4850ac
004850cb 8b7604                   mov esi, dword ptr [esi + 4]
004850ce 85f6                     test esi, esi
004850d0 75c8                     jne 0x48509a
004850d2 8b3d78038900             mov edi, dword ptr [0x890378]
004850d8 393d84038900             cmp dword ptr [0x890384], edi
004850de 7642                     jbe 0x485122
004850e0 bb03000000               mov ebx, 3
004850e5 be00000040               mov esi, 0x40000000
004850ea 33c0                     xor eax, eax
004850ec 8a472a                   mov al, byte ptr [edi + 0x2a]
004850ef 83f807                   cmp eax, 7
004850f2 7520                     jne 0x485114
004850f4 33c0                     xor eax, eax
004850f6 8a472b                   mov al, byte ptr [edi + 0x2b]
004850f9 83f859                   cmp eax, 0x59
004850fc 7516                     jne 0x485114
004850fe 381d00f08800             cmp byte ptr [0x88f000], bl
00485104 740e                     je 0x485114
00485106 857710                   test dword ptr [edi + 0x10], esi
00485109 7509                     jne 0x485114
0048510b 57                       push edi
0048510c e84f3bffff               call 0x478c60
00485111 83c404                   add esp, 4
00485114 81c7b3000000             add edi, 0xb3
0048511a 393d84038900             cmp dword ptr [0x890384], edi
00485120 77c8                     ja 0x4850ea
; class-state-dispatch-call-sites: [004ed640,004ed6c4), SHA256 6e3e2eda73f3071bdc699413e4f9a90d4d33050a3f24a26a24dd4b1b76ab9c17
004ed640 33c9                     xor ecx, ecx
004ed642 8b442404                 mov eax, dword ptr [esp + 4]
004ed646 8a482a                   mov cl, byte ptr [eax + 0x2a]
004ed649 49                       dec ecx
004ed64a 83f90a                   cmp ecx, 0xa
004ed64d 7774                     ja 0x4ed6c3
004ed64f ff248dc4d64e00           jmp dword ptr [ecx*4 + 0x4ed6c4]
004ed656 50                       push eax
004ed657 e8e450feff               call 0x4d2740
004ed65c 83c404                   add esp, 4
004ed65f c3                       ret
004ed660 50                       push eax
004ed661 e85a5af1ff               call 0x4030c0
004ed666 83c404                   add esp, 4
004ed669 c3                       ret
004ed66a 50                       push eax
004ed66b e8e085f5ff               call 0x445c50
004ed670 83c404                   add esp, 4
004ed673 c3                       ret
004ed674 50                       push eax
004ed675 e8f65cf7ff               call 0x463370
004ed67a 83c404                   add esp, 4
004ed67d c3                       ret
004ed67e 50                       push eax
004ed67f e88c8bfbff               call 0x4a6210
004ed684 83c404                   add esp, 4
004ed687 c3                       ret
004ed688 50                       push eax
004ed689 e862d10000               call 0x4fa7f0
004ed68e 83c404                   add esp, 4
004ed691 c3                       ret
004ed692 50                       push eax
004ed693 e8a8d00100               call 0x50a740
004ed698 83c404                   add esp, 4
004ed69b c3                       ret
004ed69c 50                       push eax
004ed69d e87ed7fcff               call 0x4bae20
004ed6a2 83c404                   add esp, 4
004ed6a5 c3                       ret
004ed6a6 50                       push eax
004ed6a7 e8a4aafcff               call 0x4b8150
004ed6ac 83c404                   add esp, 4
004ed6af c3                       ret
004ed6b0 50                       push eax
004ed6b1 e86a370100               call 0x500e20
004ed6b6 83c404                   add esp, 4
004ed6b9 c3                       ret
004ed6ba 50                       push eax
004ed6bb e87042fdff               call 0x4c1930
004ed6c0 83c404                   add esp, 4
004ed6c3 c3                       ret
; person-model-initializer: [004d23d0,004d2717), SHA256 f8f1c7570028be8dd9d105671d652a9790afc709a429d9e5748156177395bec6
004d23d0 83ec10                   sub esp, 0x10
004d23d3 53                       push ebx
004d23d4 56                       push esi
004d23d5 8b74241c                 mov esi, dword ptr [esp + 0x1c]
004d23d9 57                       push edi
004d23da 0fbe462f                 movsx eax, byte ptr [esi + 0x2f]
004d23de 814e1000010000           or dword ptr [esi + 0x10], 0x100
004d23e5 8bc8                     mov ecx, eax
004d23e7 8d1480                   lea edx, [eax + eax*4]
004d23ea 8d0451                   lea eax, [ecx + edx*2]
004d23ed 814e1400010400           or dword ptr [esi + 0x14], 0x40100
004d23f4 8d1cc0                   lea ebx, [eax + eax*8]
004d23f7 33c0                     xor eax, eax
004d23f9 8a462b                   mov al, byte ptr [esi + 0x2b]
004d23fc 8d14d9                   lea edx, [ecx + ebx*8]
004d23ff 48                       dec eax
004d2400 8dbc91c8d18900           lea edi, [ecx + edx*4 + 0x89d1c8]
004d2407 83f807                   cmp eax, 7
004d240a 0f87c1020000             ja 0x4d26d1
004d2410 ff248518274d00           jmp dword ptr [eax*4 + 0x4d2718]
004d2417 c6462fff                 mov byte ptr [esi + 0x2f], 0xff
004d241b 56                       push esi
004d241c e8ff340000               call 0x4d5920
004d2421 83c404                   add esp, 4
004d2424 33c0                     xor eax, eax
004d2426 8a462b                   mov al, byte ptr [esi + 0x2b]
004d2429 8d0c80                   lea ecx, [eax + eax*4]
004d242c 8d1489                   lea edx, [ecx + ecx*4]
004d242f 33c9                     xor ecx, ecx
004d2431 8a045567705a00           mov al, byte ptr [edx*2 + 0x5a7067]
004d2438 c0e801                   shr al, 1
004d243b 8ac8                     mov cl, al
004d243d a178d18900               mov eax, dword ptr [0x89d178]
004d2442 8bd0                     mov edx, eax
004d2444 8d1cc0                   lea ebx, [eax + eax*8]
004d2447 8d04da                   lea eax, [edx + ebx*8]
004d244a 8d0482                   lea eax, [edx + eax*4]
004d244d c1e002                   shl eax, 2
004d2450 8d04c2                   lea eax, [edx + eax*8]
004d2453 05df240000               add eax, 0x24df
004d2458 a378d18900               mov dword ptr [0x89d178], eax
004d245d 89442418                 mov dword ptr [esp + 0x18], eax
004d2461 c14c24180d               ror dword ptr [esp + 0x18], 0xd
004d2466 8b442418                 mov eax, dword ptr [esp + 0x18]
004d246a 2bd2                     sub edx, edx
004d246c a378d18900               mov dword ptr [0x89d178], eax
004d2471 f7f1                     div ecx
004d2473 02ca                     add cl, dl
004d2475 33c0                     xor eax, eax
004d2477 8a462b                   mov al, byte ptr [esi + 0x2b]
004d247a 884e7b                   mov byte ptr [esi + 0x7b], cl
004d247d 8d0c80                   lea ecx, [eax + eax*4]
004d2480 8d1489                   lea edx, [ecx + ecx*4]
004d2483 33c9                     xor ecx, ecx
004d2485 8a045568705a00           mov al, byte ptr [edx*2 + 0x5a7068]
004d248c 8b1578d18900             mov edx, dword ptr [0x89d178]
004d2492 c0e801                   shr al, 1
004d2495 8d1cd2                   lea ebx, [edx + edx*8]
004d2498 8ac8                     mov cl, al
004d249a 8bc2                     mov eax, edx
004d249c 8d14da                   lea edx, [edx + ebx*8]
004d249f 8d1490                   lea edx, [eax + edx*4]
004d24a2 c1e202                   shl edx, 2
004d24a5 8d14d0                   lea edx, [eax + edx*8]
004d24a8 81c2df240000             add edx, 0x24df
004d24ae 891578d18900             mov dword ptr [0x89d178], edx
004d24b4 89542414                 mov dword ptr [esp + 0x14], edx
004d24b8 c14c24140d               ror dword ptr [esp + 0x14], 0xd
004d24bd 8b442414                 mov eax, dword ptr [esp + 0x14]
004d24c1 2bd2                     sub edx, edx
004d24c3 a378d18900               mov dword ptr [0x89d178], eax
004d24c8 f7f1                     div ecx
004d24ca 66c786870000000000       mov word ptr [esi + 0x87], 0
004d24d3 816610ffff7fff           and dword ptr [esi + 0x10], 0xff7fffff
004d24da 02ca                     add cl, dl
004d24dc 884e7c                   mov byte ptr [esi + 0x7c], cl
004d24df e9ed010000               jmp 0x4d26d1
004d24e4 56                       push esi
004d24e5 e836340000               call 0x4d5920
004d24ea 83c404                   add esp, 4
004d24ed f60568c6890004           test byte ptr [0x89c668], 4
004d24f4 0f84d7010000             je 0x4d26d1
004d24fa 807e2f00                 cmp byte ptr [esi + 0x2f], 0
004d24fe 0f85cd010000             jne 0x4d26d1
004d2504 33c0                     xor eax, eax
004d2506 8a462b                   mov al, byte ptr [esi + 0x2b]
004d2509 8d0c80                   lea ecx, [eax + eax*4]
004d250c 8d1c89                   lea ebx, [ecx + ecx*4]
004d250f 8b0c5d70705a00           mov ecx, dword ptr [ebx*2 + 0x5a7070]
004d2516 8d145d00000000           lea edx, [ebx*2]
004d251d 03c9                     add ecx, ecx
004d251f f68290705a0008           test byte ptr [edx + 0x5a7090], 8
004d2526 745c                     je 0x4d2584
004d2528 a178d18900               mov eax, dword ptr [0x89d178]
004d252d 8bd0                     mov edx, eax
004d252f 8d1cc0                   lea ebx, [eax + eax*8]
004d2532 8d04da                   lea eax, [edx + ebx*8]
004d2535 8d0482                   lea eax, [edx + eax*4]
004d2538 c1e002                   shl eax, 2
004d253b 8d04c2                   lea eax, [edx + eax*8]
004d253e 05df240000               add eax, 0x24df
004d2543 a378d18900               mov dword ptr [0x89d178], eax
004d2548 89442410                 mov dword ptr [esp + 0x10], eax
004d254c c14c24100d               ror dword ptr [esp + 0x10], 0xd
004d2551 8b442410                 mov eax, dword ptr [esp + 0x10]
004d2555 a378d18900               mov dword ptr [0x89d178], eax
004d255a 8bc1                     mov eax, ecx
004d255c 99                       cdq
004d255d 83e203                   and edx, 3
004d2560 03c2                     add eax, edx
004d2562 2bd2                     sub edx, edx
004d2564 c1f802                   sar eax, 2
004d2567 8bd8                     mov ebx, eax
004d2569 8b442410                 mov eax, dword ptr [esp + 0x10]
004d256d f7f3                     div ebx
004d256f 8bda                     mov ebx, edx
004d2571 8d0449                   lea eax, [ecx + ecx*2]
004d2574 99                       cdq
004d2575 83e203                   and edx, 3
004d2578 03c2                     add eax, edx
004d257a c1f802                   sar eax, 2
004d257d 8d0c03                   lea ecx, [ebx + eax]
004d2580 66894e6c                 mov word ptr [esi + 0x6c], cx
004d2584 66894e6e                 mov word ptr [esi + 0x6e], cx
004d2588 e944010000               jmp 0x4d26d1
004d258d 56                       push esi
004d258e e88d330000               call 0x4d5920
004d2593 83c404                   add esp, 4
004d2596 e936010000               jmp 0x4d26d1
004d259b 56                       push esi
004d259c e87f330000               call 0x4d5920
004d25a1 83c404                   add esp, 4
004d25a4 e928010000               jmp 0x4d26d1
004d25a9 56                       push esi
004d25aa e871330000               call 0x4d5920
004d25af 83c404                   add esp, 4
004d25b2 8a462f                   mov al, byte ptr [esi + 0x2f]
004d25b5 834e1020                 or dword ptr [esi + 0x10], 0x20
004d25b9 c0e006                   shl al, 6
004d25bc 8886b2000000             mov byte ptr [esi + 0xb2], al
004d25c2 e90a010000               jmp 0x4d26d1
004d25c7 56                       push esi
004d25c8 e853330000               call 0x4d5920
004d25cd 83c404                   add esp, 4
004d25d0 e9fc000000               jmp 0x4d26d1
004d25d5 56                       push esi
004d25d6 e845330000               call 0x4d5920
004d25db 0fbe462f                 movsx eax, byte ptr [esi + 0x2f]
004d25df 8d1480                   lea edx, [eax + eax*4]
004d25e2 83c404                   add esp, 4
004d25e5 8bc8                     mov ecx, eax
004d25e7 8d0451                   lea eax, [ecx + edx*2]
004d25ea 8d1cc0                   lea ebx, [eax + eax*8]
004d25ed 8d14d9                   lea edx, [ecx + ebx*8]
004d25f0 89b49165da8900           mov dword ptr [ecx + edx*4 + 0x89da65], esi
004d25f7 e9d5000000               jmp 0x4d26d1
004d25fc 56                       push esi
004d25fd e81e330000               call 0x4d5920
004d2602 83c404                   add esp, 4
004d2605 6a00                     push 0
004d2607 68d8000000               push 0xd8
004d260c 56                       push esi
004d260d e83e7afbff               call 0x48a050
004d2612 83c40c                   add esp, 0xc
004d2615 8b460c                   mov eax, dword ptr [esi + 0xc]
004d2618 0d00000400               or eax, 0x40000
004d261d 89460c                   mov dword ptr [esi + 0xc], eax
004d2620 0d00400000               or eax, 0x4000
004d2625 89460c                   mov dword ptr [esi + 0xc], eax
004d2628 8b4610                   mov eax, dword ptr [esi + 0x10]
004d262b 0d80000000               or eax, 0x80
004d2630 894610                   mov dword ptr [esi + 0x10], eax
004d2633 25ffff7fff               and eax, 0xff7fffff
004d2638 894610                   mov dword ptr [esi + 0x10], eax
004d263b a178d18900               mov eax, dword ptr [0x89d178]
004d2640 8bc8                     mov ecx, eax
004d2642 8d14c0                   lea edx, [eax + eax*8]
004d2645 8d04d1                   lea eax, [ecx + edx*8]
004d2648 8d0481                   lea eax, [ecx + eax*4]
004d264b c1e002                   shl eax, 2
004d264e 8d04c1                   lea eax, [ecx + eax*8]
004d2651 05df240000               add eax, 0x24df
004d2656 a378d18900               mov dword ptr [0x89d178], eax
004d265b 8944240c                 mov dword ptr [esp + 0xc], eax
004d265f c14c240c0d               ror dword ptr [esp + 0xc], 0xd
004d2664 8b44240c                 mov eax, dword ptr [esp + 0xc]
004d2668 8bc8                     mov ecx, eax
004d266a a378d18900               mov dword ptr [0x89d178], eax
004d266f 81e1ff070000             and ecx, 0x7ff
004d2675 8b460c                   mov eax, dword ptr [esi + 0xc]
004d2678 a880                     test al, 0x80
004d267a 7404                     je 0x4d2680
004d267c 66894e57                 mov word ptr [esi + 0x57], cx
004d2680 f6c480                   test ah, 0x80
004d2683 66894e5d                 mov word ptr [esi + 0x5d], cx
004d2687 740a                     je 0x4d2693
004d2689 6681c10004               add cx, 0x400
004d268e 6681e1ff07               and cx, 0x7ff
004d2693 66894e26                 mov word ptr [esi + 0x26], cx
004d2697 6a00                     push 0
004d2699 6a00                     push 0
004d269b 8d4633                   lea eax, [esi + 0x33]
004d269e 50                       push eax
004d269f e85cc00100               call 0x4ee700
004d26a4 668b4635                 mov ax, word ptr [esi + 0x35]
004d26a8 83c40c                   add esp, 0xc
004d26ab 8b4e0c                   mov ecx, dword ptr [esi + 0xc]
004d26ae 80cc01                   or ah, 1
004d26b1 66894635                 mov word ptr [esi + 0x35], ax
004d26b5 81c900000010             or ecx, 0x10000000
004d26bb 0c10                     or al, 0x10
004d26bd 894e0c                   mov dword ptr [esi + 0xc], ecx
004d26c0 66894635                 mov word ptr [esi + 0x35], ax
004d26c4 81c900000040             or ecx, 0x40000000
004d26ca c6462d00                 mov byte ptr [esi + 0x2d], 0
004d26ce 894e0c                   mov dword ptr [esi + 0xc], ecx
004d26d1 33c0                     xor eax, eax
004d26d3 8a462b                   mov al, byte ptr [esi + 0x2b]
004d26d6 83f801                   cmp eax, 1
004d26d9 7418                     je 0x4d26f3
004d26db 83f808                   cmp eax, 8
004d26de 7413                     je 0x4d26f3
004d26e0 33c0                     xor eax, eax
004d26e2 ff871d090000             inc dword ptr [edi + 0x91d]
004d26e8 8a462b                   mov al, byte ptr [esi + 0x2b]
004d26eb 66ff8447270a0000         inc word ptr [edi + eax*2 + 0xa27]
004d26f3 668b463f                 mov ax, word ptr [esi + 0x3f]
004d26f7 668b4e3d                 mov cx, word ptr [esi + 0x3d]
004d26fb 50                       push eax
004d26fc 51                       push ecx
004d26fd e83ec2f7ff               call 0x44e940
004d2702 66894641                 mov word ptr [esi + 0x41], ax
004d2706 83c408                   add esp, 8
004d2709 816610fffbffff           and dword ptr [esi + 0x10], 0xfffffbff
004d2710 5f                       pop edi
004d2711 5e                       pop esi
004d2712 5b                       pop ebx
004d2713 83c410                   add esp, 0x10
004d2716 c3                       ret
; common-person-initializer: [004d5920,004d5b5c), SHA256 8d032712205c00c6fe31a9faf46e7d15d2209e5a195bd8384a942d24bdf121d4
004d5920 83ec0c                   sub esp, 0xc
004d5923 53                       push ebx
004d5924 56                       push esi
004d5925 8b742418                 mov esi, dword ptr [esp + 0x18]
004d5929 57                       push edi
004d592a 8d7e3d                   lea edi, [esi + 0x3d]
004d592d 57                       push edi
004d592e 56                       push esi
004d592f e83c8b0100               call 0x4ee470
004d5934 83c408                   add esp, 8
004d5937 a178d18900               mov eax, dword ptr [0x89d178]
004d593c 8bc8                     mov ecx, eax
004d593e 8d14c0                   lea edx, [eax + eax*8]
004d5941 8d04d1                   lea eax, [ecx + edx*8]
004d5944 8d0481                   lea eax, [ecx + eax*4]
004d5947 c1e002                   shl eax, 2
004d594a 8d04c1                   lea eax, [ecx + eax*8]
004d594d 05df240000               add eax, 0x24df
004d5952 a378d18900               mov dword ptr [0x89d178], eax
004d5957 89442414                 mov dword ptr [esp + 0x14], eax
004d595b c14c24140d               ror dword ptr [esp + 0x14], 0xd
004d5960 8b442414                 mov eax, dword ptr [esp + 0x14]
004d5964 56                       push esi
004d5965 a378d18900               mov dword ptr [0x89d178], eax
004d596a e8f14a0100               call 0x4ea460
004d596f 83c404                   add esp, 4
004d5972 8b460c                   mov eax, dword ptr [esi + 0xc]
004d5975 0d80000000               or eax, 0x80
004d597a 89460c                   mov dword ptr [esi + 0xc], eax
004d597d 0d00100000               or eax, 0x1000
004d5982 89460c                   mov dword ptr [esi + 0xc], eax
004d5985 8b442414                 mov eax, dword ptr [esp + 0x14]
004d5989 6625ff07                 and ax, 0x7ff
004d598d 66894657                 mov word ptr [esi + 0x57], ax
004d5991 33c0                     xor eax, eax
004d5993 8a462b                   mov al, byte ptr [esi + 0x2b]
004d5996 8d0c80                   lea ecx, [eax + eax*4]
004d5999 8d0489                   lea eax, [ecx + ecx*4]
004d599c 03c0                     add eax, eax
004d599e 8a8866705a00             mov cl, byte ptr [eax + 0x5a7066]
004d59a4 884e30                   mov byte ptr [esi + 0x30], cl
004d59a7 8b8870705a00             mov ecx, dword ptr [eax + 0x5a7070]
004d59ad 66c7466c0000             mov word ptr [esi + 0x6c], 0
004d59b3 f68090705a0008           test byte ptr [eax + 0x5a7090], 8
004d59ba 7467                     je 0x4d5a23
004d59bc a178d18900               mov eax, dword ptr [0x89d178]
004d59c1 8bd0                     mov edx, eax
004d59c3 8d1cc0                   lea ebx, [eax + eax*8]
004d59c6 8d04da                   lea eax, [edx + ebx*8]
004d59c9 8d0482                   lea eax, [edx + eax*4]
004d59cc c1e002                   shl eax, 2
004d59cf 8d04c2                   lea eax, [edx + eax*8]
004d59d2 05df240000               add eax, 0x24df
004d59d7 a378d18900               mov dword ptr [0x89d178], eax
004d59dc 89442410                 mov dword ptr [esp + 0x10], eax
004d59e0 c14c24100d               ror dword ptr [esp + 0x10], 0xd
004d59e5 8b442410                 mov eax, dword ptr [esp + 0x10]
004d59e9 a378d18900               mov dword ptr [0x89d178], eax
004d59ee 8bc1                     mov eax, ecx
004d59f0 99                       cdq
004d59f1 83e203                   and edx, 3
004d59f4 03c2                     add eax, edx
004d59f6 2bd2                     sub edx, edx
004d59f8 c1f802                   sar eax, 2
004d59fb 8bd8                     mov ebx, eax
004d59fd 8b442410                 mov eax, dword ptr [esp + 0x10]
004d5a01 f7f3                     div ebx
004d5a03 8bda                     mov ebx, edx
004d5a05 8d0449                   lea eax, [ecx + ecx*2]
004d5a08 99                       cdq
004d5a09 83e203                   and edx, 3
004d5a0c 03c2                     add eax, edx
004d5a0e c1f802                   sar eax, 2
004d5a11 66833dddc689000c         cmp word ptr [0x89c6dd], 0xc
004d5a19 8d0c03                   lea ecx, [ebx + eax]
004d5a1c 7501                     jne 0x4d5a1f
004d5a1e 49                       dec ecx
004d5a1f 66894e6c                 mov word ptr [esi + 0x6c], cx
004d5a23 814e1000008000           or dword ptr [esi + 0x10], 0x800000
004d5a2a 66894e6e                 mov word ptr [esi + 0x6e], cx
004d5a2e 8d5e68                   lea ebx, [esi + 0x68]
004d5a31 8b07                     mov eax, dword ptr [edi]
004d5a33 b900000000               mov ecx, 0
004d5a38 8903                     mov dword ptr [ebx], eax
004d5a3a 8b460c                   mov eax, dword ptr [esi + 0xc]
004d5a3d f6c404                   test ah, 4
004d5a40 7415                     je 0x4d5a57
004d5a42 25fffbffff               and eax, 0xfffffbff
004d5a47 89460c                   mov dword ptr [esi + 0xc], eax
004d5a4a 832d4324890014           sub dword ptr [0x892443], 0x14
004d5a51 8b0d43248900             mov ecx, dword ptr [0x892443]
004d5a57 85c9                     test ecx, ecx
004d5a59 7418                     je 0x4d5a73
004d5a5b 8b01                     mov eax, dword ptr [ecx]
004d5a5d 668903                   mov word ptr [ebx], ax
004d5a60 8b5104                   mov edx, dword ptr [ecx + 4]
004d5a63 6689566a                 mov word ptr [esi + 0x6a], dx
004d5a67 668b4108                 mov ax, word ptr [ecx + 8]
004d5a6b 66894626                 mov word ptr [esi + 0x26], ax
004d5a6f 6689465d                 mov word ptr [esi + 0x5d], ax
004d5a73 668b03                   mov ax, word ptr [ebx]
004d5a76 668b4e6a                 mov cx, word ptr [esi + 0x6a]
004d5a7a 8864240e                 mov byte ptr [esp + 0xe], ah
004d5a7e 33c0                     xor eax, eax
004d5a80 886c240f                 mov byte ptr [esp + 0xf], ch
004d5a84 668b44240e               mov ax, word ptr [esp + 0xe]
004d5a89 33c9                     xor ecx, ecx
004d5a8b 668b4c240e               mov cx, word ptr [esp + 0xe]
004d5a90 25fe000000               and eax, 0xfe
004d5a95 03c0                     add eax, eax
004d5a97 81e100fe0000             and ecx, 0xfe00
004d5a9d 0bc1                     or eax, ecx
004d5a9f 8d0485e4038a00           lea eax, [eax*4 + 0x8a03e4]
004d5aa6 f6400102                 test byte ptr [eax + 1], 2
004d5aaa 741d                     je 0x4d5ac9
004d5aac 53                       push ebx
004d5aad 33c9                     xor ecx, ecx
004d5aaf 668b4808                 mov cx, word ptr [eax + 8]
004d5ab3 81e1ff030000             and ecx, 0x3ff
004d5ab9 8b048d90038900           mov eax, dword ptr [ecx*4 + 0x890390]
004d5ac0 50                       push eax
004d5ac1 e8eae9f2ff               call 0x4044b0
004d5ac6 83c408                   add esp, 8
004d5ac9 668b03                   mov ax, word ptr [ebx]
004d5acc 662500fe                 and ax, 0xfe00
004d5ad0 66050001                 add ax, 0x100
004d5ad4 668903                   mov word ptr [ebx], ax
004d5ad7 56                       push esi
004d5ad8 668b466a                 mov ax, word ptr [esi + 0x6a]
004d5adc 662500fe                 and ax, 0xfe00
004d5ae0 66050001                 add ax, 0x100
004d5ae4 6689466a                 mov word ptr [esi + 0x6a], ax
004d5ae8 8b0b                     mov ecx, dword ptr [ebx]
004d5aea 894e4f                   mov dword ptr [esi + 0x4f], ecx
004d5aed e84e400100               call 0x4e9b40
004d5af2 83c404                   add esp, 4
004d5af5 f6460e10                 test byte ptr [esi + 0xe], 0x10
004d5af9 754d                     jne 0x4d5b48
004d5afb 8a462c                   mov al, byte ptr [esi + 0x2c]
004d5afe 88467d                   mov byte ptr [esi + 0x7d], al
004d5b01 f6057cd1890002           test byte ptr [0x89d17c], 2
004d5b08 7417                     je 0x4d5b21
004d5b0a 8a462b                   mov al, byte ptr [esi + 0x2b]
004d5b0d 3c07                     cmp al, 7
004d5b0f 7504                     jne 0x4d5b15
004d5b11 b327                     mov bl, 0x27
004d5b13 eb1e                     jmp 0x4d5b33
004d5b15 33c9                     xor ecx, ecx
004d5b17 8ac8                     mov cl, al
004d5b19 8d0489                   lea eax, [ecx + ecx*4]
004d5b1c 8d1480                   lea edx, [eax + eax*4]
004d5b1f eb0b                     jmp 0x4d5b2c
004d5b21 33c0                     xor eax, eax
004d5b23 8a462b                   mov al, byte ptr [esi + 0x2b]
004d5b26 8d0c80                   lea ecx, [eax + eax*4]
004d5b29 8d1489                   lea edx, [ecx + ecx*4]
004d5b2c 8a1c5564705a00           mov bl, byte ptr [edx*2 + 0x5a7064]
004d5b33 56                       push esi
004d5b34 e8b77b0100               call 0x4ed6f0
004d5b39 83c404                   add esp, 4
004d5b3c 885e2c                   mov byte ptr [esi + 0x2c], bl
004d5b3f 56                       push esi
004d5b40 e8fb7a0100               call 0x4ed640
004d5b45 83c404                   add esp, 4
004d5b48 807e2fff                 cmp byte ptr [esi + 0x2f], 0xff
004d5b4c 7407                     je 0x4d5b55
004d5b4e c686b0000000ff           mov byte ptr [esi + 0xb0], 0xff
004d5b55 5f                       pop edi
004d5b56 5e                       pop esi
004d5b57 5b                       pop ebx
004d5b58 83c40c                   add esp, 0xc
004d5b5b c3                       ret
; effect-state-initializer: [0050a740,0050a741), SHA256 ae3f4619b0413d70d3004b9131c3752153074e45725be13b9a148978895e359e
0050a740 c3                       ret
; nested-building-facade-initializer: [004fc330,004fc56b), SHA256 2730bc1dbd93880d16df25a50388ae91eb991a1d0bcf20271435e2111e78f663
004fc330 83ec20                   sub esp, 0x20
004fc333 53                       push ebx
004fc334 56                       push esi
004fc335 57                       push edi
004fc336 bbffffffff               mov ebx, 0xffffffff
004fc33b 55                       push ebp
004fc33c 33ff                     xor edi, edi
004fc33e 33ed                     xor ebp, ebp
004fc340 b96b000000               mov ecx, 0x6b
004fc345 8b742434                 mov esi, dword ptr [esp + 0x34]
004fc349 ba00000000               mov edx, 0
004fc34e 895c2410                 mov dword ptr [esp + 0x10], ebx
004fc352 8b460c                   mov eax, dword ptr [esi + 0xc]
004fc355 f6c404                   test ah, 4
004fc358 7415                     je 0x4fc36f
004fc35a 25fffbffff               and eax, 0xfffffbff
004fc35f 89460c                   mov dword ptr [esi + 0xc], eax
004fc362 832d4324890014           sub dword ptr [0x892443], 0x14
004fc369 8b1543248900             mov edx, dword ptr [0x892443]
004fc36f 85d2                     test edx, edx
004fc371 7414                     je 0x4fc387
004fc373 8b1a                     mov ebx, dword ptr [edx]
004fc375 8b4204                   mov eax, dword ptr [edx + 4]
004fc378 8b6a08                   mov ebp, dword ptr [edx + 8]
004fc37b 89442410                 mov dword ptr [esp + 0x10], eax
004fc37f 0fbf7d26                 movsx edi, word ptr [ebp + 0x26]
004fc383 0fbf4d33                 movsx ecx, word ptr [ebp + 0x33]
004fc387 85db                     test ebx, ebx
004fc389 7f46                     jg 0x4fc3d1
004fc38b a178d18900               mov eax, dword ptr [0x89d178]
004fc390 8bd0                     mov edx, eax
004fc392 8d1cc0                   lea ebx, [eax + eax*8]
004fc395 8d04da                   lea eax, [edx + ebx*8]
004fc398 8d0482                   lea eax, [edx + eax*4]
004fc39b c1e002                   shl eax, 2
004fc39e 8d04c2                   lea eax, [edx + eax*8]
004fc3a1 05df240000               add eax, 0x24df
004fc3a6 a378d18900               mov dword ptr [0x89d178], eax
004fc3ab 89442418                 mov dword ptr [esp + 0x18], eax
004fc3af c14c24180d               ror dword ptr [esp + 0x18], 0xd
004fc3b4 8b442418                 mov eax, dword ptr [esp + 0x18]
004fc3b8 bb03000000               mov ebx, 3
004fc3bd 2bd2                     sub edx, edx
004fc3bf a378d18900               mov dword ptr [0x89d178], eax
004fc3c4 f7f3                     div ebx
004fc3c6 c7442410ffffffff         mov dword ptr [esp + 0x10], 0xffffffff
004fc3ce 8d5a01                   lea ebx, [edx + 1]
004fc3d1 837c241000               cmp dword ptr [esp + 0x10], 0
004fc3d6 7d48                     jge 0x4fc420
004fc3d8 83fb03                   cmp ebx, 3
004fc3db 743b                     je 0x4fc418
004fc3dd a178d18900               mov eax, dword ptr [0x89d178]
004fc3e2 8bd0                     mov edx, eax
004fc3e4 8d04c0                   lea eax, [eax + eax*8]
004fc3e7 8d04c2                   lea eax, [edx + eax*8]
004fc3ea 8d0482                   lea eax, [edx + eax*4]
004fc3ed c1e002                   shl eax, 2
004fc3f0 8d04c2                   lea eax, [edx + eax*8]
004fc3f3 05df240000               add eax, 0x24df
004fc3f8 a378d18900               mov dword ptr [0x89d178], eax
004fc3fd 89442414                 mov dword ptr [esp + 0x14], eax
004fc401 c14c24140d               ror dword ptr [esp + 0x14], 0xd
004fc406 8b442414                 mov eax, dword ptr [esp + 0x14]
004fc40a a378d18900               mov dword ptr [0x89d178], eax
004fc40f 83e001                   and eax, 1
004fc412 89442410                 mov dword ptr [esp + 0x10], eax
004fc416 eb08                     jmp 0x4fc420
004fc418 c744241002000000         mov dword ptr [esp + 0x10], 2
004fc420 85ed                     test ebp, ebp
004fc422 745a                     je 0x4fc47e
004fc424 8d0c49                   lea ecx, [ecx + ecx*2]
004fc427 8bc7                     mov eax, edi
004fc429 99                       cdq
004fc42a 03c9                     add ecx, ecx
004fc42c 81e2ff010000             and edx, 0x1ff
004fc432 03c2                     add eax, edx
004fc434 8d0cc9                   lea ecx, [ecx + ecx*8]
004fc437 c1f809                   sar eax, 9
004fc43a 03c8                     add ecx, eax
004fc43c a1c15e8900               mov eax, dword ptr [0x895ec1]
004fc441 0fbe4c012c               movsx ecx, byte ptr [ecx + eax + 0x2c]
004fc446 c1e104                   shl ecx, 4
004fc449 668b457a                 mov ax, word ptr [ebp + 0x7a]
004fc44d 8d0c49                   lea ecx, [ecx + ecx*2]
004fc450 030d3cdf5900             add ecx, dword ptr [0x59df3c]
004fc456 660fb65102               movzx dx, byte ptr [ecx + 2]
004fc45b 66c1e208                 shl dx, 8
004fc45f 662bc2                   sub ax, dx
004fc462 660fb65103               movzx dx, byte ptr [ecx + 3]
004fc467 66c1e208                 shl dx, 8
004fc46b 6689442428               mov word ptr [esp + 0x28], ax
004fc470 668b457c                 mov ax, word ptr [ebp + 0x7c]
004fc474 662bc2                   sub ax, dx
004fc477 668944242a               mov word ptr [esp + 0x2a], ax
004fc47c eb17                     jmp 0x4fc495
004fc47e 8d463d                   lea eax, [esi + 0x3d]
004fc481 8d542428                 lea edx, [esp + 0x28]
004fc485 8b08                     mov ecx, dword ptr [eax]
004fc487 668b4004                 mov ax, word ptr [eax + 4]
004fc48b 890a                     mov dword ptr [edx], ecx
004fc48d 66894204                 mov word ptr [edx + 4], ax
004fc491 8b4c241c                 mov ecx, dword ptr [esp + 0x1c]
004fc495 8b442410                 mov eax, dword ptr [esp + 0x10]
004fc499 8d0440                   lea eax, [eax + eax*2]
004fc49c 03c1                     add eax, ecx
004fc49e 660fb64811               movzx cx, byte ptr [eax + 0x11]
004fc4a3 66c1e105                 shl cx, 5
004fc4a7 660fb64013               movzx ax, byte ptr [eax + 0x13]
004fc4ac 66c1e005                 shl ax, 5
004fc4b0 66034c2428               add cx, word ptr [esp + 0x28]
004fc4b5 66894c2420               mov word ptr [esp + 0x20], cx
004fc4ba 8b4c2420                 mov ecx, dword ptr [esp + 0x20]
004fc4be 660344242a               add ax, word ptr [esp + 0x2a]
004fc4c3 6689442422               mov word ptr [esp + 0x22], ax
004fc4c8 8b442422                 mov eax, dword ptr [esp + 0x22]
004fc4cc 50                       push eax
004fc4cd 51                       push ecx
004fc4ce e86d24f5ff               call 0x44e940
004fc4d3 668944242c               mov word ptr [esp + 0x2c], ax
004fc4d8 83c408                   add esp, 8
004fc4db f6460e10                 test byte ptr [esi + 0xe], 0x10
004fc4df 7516                     jne 0x4fc4f7
004fc4e1 56                       push esi
004fc4e2 e80912ffff               call 0x4ed6f0
004fc4e7 83c404                   add esp, 4
004fc4ea c6462c07                 mov byte ptr [esi + 0x2c], 7
004fc4ee 56                       push esi
004fc4ef e84c11ffff               call 0x4ed640
004fc4f4 83c404                   add esp, 4
004fc4f7 8d6e3d                   lea ebp, [esi + 0x3d]
004fc4fa 8d442420                 lea eax, [esp + 0x20]
004fc4fe 55                       push ebp
004fc4ff 56                       push esi
004fc500 8b08                     mov ecx, dword ptr [eax]
004fc502 668b4004                 mov ax, word ptr [eax + 4]
004fc506 894d00                   mov dword ptr [ebp], ecx
004fc509 66894504                 mov word ptr [ebp + 4], ax
004fc50d e85e1fffff               call 0x4ee470
004fc512 668b4e3f                 mov cx, word ptr [esi + 0x3f]
004fc516 83c408                   add esp, 8
004fc519 668b5500                 mov dx, word ptr [ebp]
004fc51d 51                       push ecx
004fc51e 52                       push edx
004fc51f e81c24f5ff               call 0x44e940
004fc524 66894641                 mov word ptr [esi + 0x41], ax
004fc528 8a4c2418                 mov cl, byte ptr [esp + 0x18]
004fc52c 816610fffbffff           and dword ptr [esi + 0x10], 0xfffffbff
004fc533 66897e26                 mov word ptr [esi + 0x26], di
004fc537 83c408                   add esp, 8
004fc53a 8d045b                   lea eax, [ebx + ebx*2]
004fc53d 885e2d                   mov byte ptr [esi + 0x2d], bl
004fc540 c1e002                   shl eax, 2
004fc543 888ea7000000             mov byte ptr [esi + 0xa7], cl
004fc549 83c633                   add esi, 0x33
004fc54c 8b8818785a00             mov ecx, dword ptr [eax + 0x5a7818]
004fc552 51                       push ecx
004fc553 8b901c785a00             mov edx, dword ptr [eax + 0x5a781c]
004fc559 52                       push edx
004fc55a 56                       push esi
004fc55b e8a021ffff               call 0x4ee700
004fc560 83c40c                   add esp, 0xc
004fc563 5d                       pop ebp
004fc564 5f                       pop edi
004fc565 5e                       pop esi
004fc566 5b                       pop ebx
004fc567 83c420                   add esp, 0x20
004fc56a c3                       ret
; head-appearance-initializer: [004fbd20,004fbf40), SHA256 c48f459fda1a82d75a7cf4bbf3561decf9d1b4bbfe9a1a14a8d2ec24a617e341
004fbd20 83ec04                   sub esp, 4
004fbd23 53                       push ebx
004fbd24 56                       push esi
004fbd25 8b742414                 mov esi, dword ptr [esp + 0x14]
004fbd29 57                       push edi
004fbd2a 55                       push ebp
004fbd2b 85f6                     test esi, esi
004fbd2d 755c                     jne 0x4fbd8b
004fbd2f 33f6                     xor esi, esi
004fbd31 8b7c2418                 mov edi, dword ptr [esp + 0x18]
004fbd35 8b1570038900             mov edx, dword ptr [0x890370]
004fbd3b 8b473d                   mov eax, dword ptr [edi + 0x3d]
004fbd3e 668bc8                   mov cx, ax
004fbd41 89442410                 mov dword ptr [esp + 0x10], eax
004fbd45 668b6c2412               mov bp, word ptr [esp + 0x12]
004fbd4a 3bd6                     cmp edx, esi
004fbd4c 7441                     je 0x4fbd8f
004fbd4e 8b5a08                   mov ebx, dword ptr [edx + 8]
004fbd51 8b420c                   mov eax, dword ptr [edx + 0xc]
004fbd54 a801                     test al, 1
004fbd56 7527                     jne 0x4fbd7f
004fbd58 807a2c0c                 cmp byte ptr [edx + 0x2c], 0xc
004fbd5c 7421                     je 0x4fbd7f
004fbd5e a900000200               test eax, 0x20000
004fbd63 741a                     je 0x4fbd7f
004fbd65 668b423d                 mov ax, word ptr [edx + 0x3d]
004fbd69 6633c1                   xor ax, cx
004fbd6c 66a900fe                 test ax, 0xfe00
004fbd70 750d                     jne 0x4fbd7f
004fbd72 668b423f                 mov ax, word ptr [edx + 0x3f]
004fbd76 6633c5                   xor ax, bp
004fbd79 66a900fe                 test ax, 0xfe00
004fbd7d 7408                     je 0x4fbd87
004fbd7f 8bd3                     mov edx, ebx
004fbd81 85db                     test ebx, ebx
004fbd83 75c9                     jne 0x4fbd4e
004fbd85 eb08                     jmp 0x4fbd8f
004fbd87 8bf2                     mov esi, edx
004fbd89 eb04                     jmp 0x4fbd8f
004fbd8b 8b7c2418                 mov edi, dword ptr [esp + 0x18]
004fbd8f 85f6                     test esi, esi
004fbd91 0f84a1010000             je 0x4fbf38
004fbd97 33c0                     xor eax, eax
004fbd99 8a4768                   mov al, byte ptr [edi + 0x68]
004fbd9c 83f803                   cmp eax, 3
004fbd9f 0f8422010000             je 0x4fbec7
004fbda5 83f805                   cmp eax, 5
004fbda8 0f846d010000             je 0x4fbf1b
004fbdae 8a476d                   mov al, byte ptr [edi + 0x6d]
004fbdb1 a820                     test al, 0x20
004fbdb3 7455                     je 0x4fbe0a
004fbdb5 c6869700000002           mov byte ptr [esi + 0x97], 2
004fbdbc 837c242400               cmp dword ptr [esp + 0x24], 0
004fbdc1 66c746332d00             mov word ptr [esi + 0x33], 0x2d
004fbdc7 740d                     je 0x4fbdd6
004fbdc9 6a2d                     push 0x2d
004fbdcb 6a04                     push 4
004fbdcd 56                       push esi
004fbdce e8eda8faff               call 0x4a66c0
004fbdd3 83c40c                   add esp, 0xc
004fbdd6 f6476d01                 test byte ptr [edi + 0x6d], 1
004fbdda 7411                     je 0x4fbded
004fbddc 56                       push esi
004fbddd e80e0ef1ff               call 0x40cbf0
004fbde2 83c404                   add esp, 4
004fbde5 5d                       pop ebp
004fbde6 5f                       pop edi
004fbde7 5e                       pop esi
004fbde8 5b                       pop ebx
004fbde9 83c404                   add esp, 4
004fbdec c3                       ret
004fbded f6463604                 test byte ptr [esi + 0x36], 4
004fbdf1 0f8541010000             jne 0x4fbf38
004fbdf7 6a01                     push 1
004fbdf9 56                       push esi
004fbdfa e8910df1ff               call 0x40cb90
004fbdff 83c408                   add esp, 8
004fbe02 5d                       pop ebp
004fbe03 5f                       pop edi
004fbe04 5e                       pop esi
004fbe05 5b                       pop ebx
004fbe06 83c404                   add esp, 4
004fbe09 c3                       ret
004fbe0a a810                     test al, 0x10
004fbe0c 743f                     je 0x4fbe4d
004fbe0e c6869700000003           mov byte ptr [esi + 0x97], 3
004fbe15 8a476d                   mov al, byte ptr [edi + 0x6d]
004fbe18 a801                     test al, 1
004fbe1a 7410                     je 0x4fbe2c
004fbe1c a808                     test al, 8
004fbe1e 740c                     je 0x4fbe2c
004fbe20 b904000000               mov ecx, 4
004fbe25 b892000000               mov eax, 0x92
004fbe2a eb0a                     jmp 0x4fbe36
004fbe2c b902000000               mov ecx, 2
004fbe31 b893000000               mov eax, 0x93
004fbe36 66894633                 mov word ptr [esi + 0x33], ax
004fbe3a 50                       push eax
004fbe3b 51                       push ecx
004fbe3c 56                       push esi
004fbe3d e87ea8faff               call 0x4a66c0
004fbe42 83c40c                   add esp, 0xc
004fbe45 5d                       pop ebp
004fbe46 5f                       pop edi
004fbe47 5e                       pop esi
004fbe48 5b                       pop ebx
004fbe49 83c404                   add esp, 4
004fbe4c c3                       ret
004fbe4d c6869700000004           mov byte ptr [esi + 0x97], 4
004fbe54 837c242400               cmp dword ptr [esp + 0x24], 0
004fbe59 66c746339500             mov word ptr [esi + 0x33], 0x95
004fbe5f 7410                     je 0x4fbe71
004fbe61 6895000000               push 0x95
004fbe66 6a04                     push 4
004fbe68 56                       push esi
004fbe69 e852a8faff               call 0x4a66c0
004fbe6e 83c40c                   add esp, 0xc
004fbe71 8a476d                   mov al, byte ptr [edi + 0x6d]
004fbe74 a801                     test al, 1
004fbe76 7432                     je 0x4fbeaa
004fbe78 a808                     test al, 8
004fbe7a 7411                     je 0x4fbe8d
004fbe7c 56                       push esi
004fbe7d e86e0df1ff               call 0x40cbf0
004fbe82 83c404                   add esp, 4
004fbe85 5d                       pop ebp
004fbe86 5f                       pop edi
004fbe87 5e                       pop esi
004fbe88 5b                       pop ebx
004fbe89 83c404                   add esp, 4
004fbe8c c3                       ret
004fbe8d f6463604                 test byte ptr [esi + 0x36], 4
004fbe91 0f85a1000000             jne 0x4fbf38
004fbe97 6a07                     push 7
004fbe99 56                       push esi
004fbe9a e8f10cf1ff               call 0x40cb90
004fbe9f 83c408                   add esp, 8
004fbea2 5d                       pop ebp
004fbea3 5f                       pop edi
004fbea4 5e                       pop esi
004fbea5 5b                       pop ebx
004fbea6 83c404                   add esp, 4
004fbea9 c3                       ret
004fbeaa f6463604                 test byte ptr [esi + 0x36], 4
004fbeae 0f8584000000             jne 0x4fbf38
004fbeb4 6a01                     push 1
004fbeb6 56                       push esi
004fbeb7 e8d40cf1ff               call 0x40cb90
004fbebc 83c408                   add esp, 8
004fbebf 5d                       pop ebp
004fbec0 5f                       pop edi
004fbec1 5e                       pop esi
004fbec2 5b                       pop ebx
004fbec3 83c404                   add esp, 4
004fbec6 c3                       ret
004fbec7 c6869700000001           mov byte ptr [esi + 0x97], 1
004fbece 837c242400               cmp dword ptr [esp + 0x24], 0
004fbed3 7413                     je 0x4fbee8
004fbed5 66c746330800             mov word ptr [esi + 0x33], 8
004fbedb 6a08                     push 8
004fbedd 6a04                     push 4
004fbedf 56                       push esi
004fbee0 e8dba7faff               call 0x4a66c0
004fbee5 83c40c                   add esp, 0xc
004fbee8 807c242000               cmp byte ptr [esp + 0x20], 0
004fbeed 7413                     je 0x4fbf02
004fbeef 6a31                     push 0x31
004fbef1 56                       push esi
004fbef2 e8b90cf1ff               call 0x40cbb0
004fbef7 83c408                   add esp, 8
004fbefa 5d                       pop ebp
004fbefb 5f                       pop edi
004fbefc 5e                       pop esi
004fbefd 5b                       pop ebx
004fbefe 83c404                   add esp, 4
004fbf01 c3                       ret
004fbf02 f6463604                 test byte ptr [esi + 0x36], 4
004fbf06 7530                     jne 0x4fbf38
004fbf08 6a01                     push 1
004fbf0a 56                       push esi
004fbf0b e8800cf1ff               call 0x40cb90
004fbf10 83c408                   add esp, 8
004fbf13 5d                       pop ebp
004fbf14 5f                       pop edi
004fbf15 5e                       pop esi
004fbf16 5b                       pop ebx
004fbf17 83c404                   add esp, 4
004fbf1a c3                       ret
004fbf1b c6869700000005           mov byte ptr [esi + 0x97], 5
004fbf22 66c746339d00             mov word ptr [esi + 0x33], 0x9d
004fbf28 689d000000               push 0x9d
004fbf2d 6a02                     push 2
004fbf2f 56                       push esi
004fbf30 e88ba7faff               call 0x4a66c0
004fbf35 83c40c                   add esp, 0xc
004fbf38 5d                       pop ebp
004fbf39 5f                       pop edi
004fbf3a 5e                       pop esi
004fbf3b 5b                       pop ebx
004fbf3c 83c404                   add esp, 4
004fbf3f c3                       ret
; head-animation-leaves: [0040cb90,0040cc07), SHA256 c769b1cbd170721dbfcccc4dc13bfd95cf8281e0d564ff1fa3d3cb3426d874eb
0040cb90 8b442404                 mov eax, dword ptr [esp + 4]
0040cb94 8a542408                 mov dl, byte ptr [esp + 8]
0040cb98 668b4835                 mov cx, word ptr [eax + 0x35]
0040cb9c 885070                   mov byte ptr [eax + 0x70], dl
0040cb9f 80cd04                   or ch, 4
0040cba2 66894835                 mov word ptr [eax + 0x35], cx
0040cba6 6681e1fff7               and cx, 0xf7ff
0040cbab 66894835                 mov word ptr [eax + 0x35], cx
0040cbaf c3                       ret
0040cbb0 8b442404                 mov eax, dword ptr [esp + 4]
0040cbb4 8a542408                 mov dl, byte ptr [esp + 8]
0040cbb8 668b4835                 mov cx, word ptr [eax + 0x35]
0040cbbc 885070                   mov byte ptr [eax + 0x70], dl
0040cbbf 80cd04                   or ch, 4
0040cbc2 66894835                 mov word ptr [eax + 0x35], cx
0040cbc6 80cd08                   or ch, 8
0040cbc9 66894835                 mov word ptr [eax + 0x35], cx
0040cbcd c3                       ret
0040cbce cc                       int3
0040cbcf cc                       int3
0040cbd0 8b442404                 mov eax, dword ptr [esp + 4]
0040cbd4 668b4835                 mov cx, word ptr [eax + 0x35]
0040cbd8 80cd04                   or ch, 4
0040cbdb 66894835                 mov word ptr [eax + 0x35], cx
0040cbdf 6681e1fff7               and cx, 0xf7ff
0040cbe4 66894835                 mov word ptr [eax + 0x35], cx
0040cbe8 c3                       ret
0040cbe9 cc                       int3
0040cbea cc                       int3
0040cbeb cc                       int3
0040cbec cc                       int3
0040cbed cc                       int3
0040cbee cc                       int3
0040cbef cc                       int3
0040cbf0 8b442404                 mov eax, dword ptr [esp + 4]
0040cbf4 668b4835                 mov cx, word ptr [eax + 0x35]
0040cbf8 f6c510                   test ch, 0x10
0040cbfb 7509                     jne 0x40cc06
0040cbfd 6681e1fffb               and cx, 0xfbff
0040cc02 66894835                 mov word ptr [eax + 0x35], cx
0040cc06 c3                       ret
; nested-reward-height-helper: [004fc790,004fc849), SHA256 007aa96cf34e326767fa939540b6e3a05a27300f526e7eb0f65479ae0061fa68
004fc790 8b442404                 mov eax, dword ptr [esp + 4]
004fc794 83ec0c                   sub esp, 0xc
004fc797 56                       push esi
004fc798 8b483d                   mov ecx, dword ptr [eax + 0x3d]
004fc79b be20030000               mov esi, 0x320
004fc7a0 894c2404                 mov dword ptr [esp + 4], ecx
004fc7a4 668b442406               mov ax, word ptr [esp + 6]
004fc7a9 886c2408                 mov byte ptr [esp + 8], ch
004fc7ad 33c9                     xor ecx, ecx
004fc7af 88642409                 mov byte ptr [esp + 9], ah
004fc7b3 668b4c2408               mov cx, word ptr [esp + 8]
004fc7b8 33c0                     xor eax, eax
004fc7ba 668b442408               mov ax, word ptr [esp + 8]
004fc7bf 81e100fe0000             and ecx, 0xfe00
004fc7c5 25fe000000               and eax, 0xfe
004fc7ca 03c0                     add eax, eax
004fc7cc 0bc1                     or eax, ecx
004fc7ce 8d0c85e4038a00           lea ecx, [eax*4 + 0x8a03e4]
004fc7d5 668b4108                 mov ax, word ptr [ecx + 8]
004fc7d9 6625ff03                 and ax, 0x3ff
004fc7dd 7459                     je 0x4fc838
004fc7df 0fb7c0                   movzx eax, ax
004fc7e2 f6410102                 test byte ptr [ecx + 1], 2
004fc7e6 8b148590038900           mov edx, dword ptr [eax*4 + 0x890390]
004fc7ed 742e                     je 0x4fc81d
004fc7ef 807a2b12                 cmp byte ptr [edx + 0x2b], 0x12
004fc7f3 7528                     jne 0x4fc81d
004fc7f5 8d442408                 lea eax, [esp + 8]
004fc7f9 50                       push eax
004fc7fa 6a01                     push 1
004fc7fc 52                       push edx
004fc7fd e83e7df0ff               call 0x404540
004fc802 83c40c                   add esp, 0xc
004fc805 8bf0                     mov esi, eax
004fc807 668b442408               mov ax, word ptr [esp + 8]
004fc80c 6689442404               mov word ptr [esp + 4], ax
004fc811 668b4c240a               mov cx, word ptr [esp + 0xa]
004fc816 66894c2406               mov word ptr [esp + 6], cx
004fc81b eb1b                     jmp 0x4fc838
004fc81d 807a2a09                 cmp byte ptr [edx + 0x2a], 9
004fc821 8d442404                 lea eax, [esp + 4]
004fc825 50                       push eax
004fc826 52                       push edx
004fc827 7507                     jne 0x4fc830
004fc829 e892d7fbff               call 0x4b9fc0
004fc82e eb05                     jmp 0x4fc835
004fc830 e87b7cf0ff               call 0x4044b0
004fc835 83c408                   add esp, 8
004fc838 8b4c2404                 mov ecx, dword ptr [esp + 4]
004fc83c 8b442418                 mov eax, dword ptr [esp + 0x18]
004fc840 8908                     mov dword ptr [eax], ecx
004fc842 8bc6                     mov eax, esi
004fc844 5e                       pop esi
004fc845 83c40c                   add esp, 0xc
004fc848 c3                       ret
; script-storage-reset: [0048c620,0048c64a), SHA256 ed7dc217e07cc0dbde8802fd107cc1bc7da23bee300ad10b198b11678f726cd6
0048c620 57                       push edi
0048c621 33c0                     xor eax, eax
0048c623 bfc2699600               mov edi, 0x9669c2
0048c628 b940000000               mov ecx, 0x40
0048c62d f3ab                     rep stosd dword ptr es:[edi], eax
0048c62f bfca9a9600               mov edi, 0x969aca
0048c634 b940000000               mov ecx, 0x40
0048c639 f3ab                     rep stosd dword ptr es:[edi], eax
0048c63b bfd2cb9600               mov edi, 0x96cbd2
0048c640 b940000000               mov ecx, 0x40
0048c645 f3ab                     rep stosd dword ptr es:[edi], eax
0048c647 5f                       pop edi
0048c648 c3                       ret
0048c649 cc                       int3
