; native_pool_bootstrap [004ed820,004ed8a0)
004ed820 b8db048e00               mov eax, 0x8e04db
004ed825 b9987a9300               mov ecx, 0x937a98
004ed82a a378038900               mov dword ptr [0x890378], eax
004ed82f 890d84038900             mov dword ptr [0x890384], ecx
004ed835 a37c038900               mov dword ptr [0x89037c], eax
004ed83a 890d8c038900             mov dword ptr [0x89038c], ecx
004ed840 b8b80a9300               mov eax, 0x930ab8
004ed845 b990038900               mov ecx, 0x890390
004ed84a a388038900               mov dword ptr [0x890388], eax
004ed84f a380038900               mov dword ptr [0x890380], eax
004ed854 b828048e00               mov eax, 0x8e0428
004ed859 8901                     mov dword ptr [ecx], eax
004ed85b 83c104                   add ecx, 4
004ed85e 05b3000000               add eax, 0xb3
004ed863 81f9d0228900             cmp ecx, 0x8922d0
004ed869 72ee                     jb 0x4ed859
004ed86b c7059003890000000000     mov dword ptr [0x890390], 0
004ed875 c3                       ret
004ed876 cc                       int3
004ed877 cc                       int3
004ed878 cc                       int3
004ed879 cc                       int3
004ed87a cc                       int3
004ed87b cc                       int3
004ed87c cc                       int3
004ed87d cc                       int3
004ed87e cc                       int3
004ed87f cc                       int3
004ed880 33c9                     xor ecx, ecx
004ed882 b828048e00               mov eax, 0x8e0428
004ed887 66894824                 mov word ptr [eax + 0x24], cx
004ed88b 05b3000000               add eax, 0xb3
004ed890 41                       inc ecx
004ed891 81f9d0070000             cmp ecx, 0x7d0
004ed897 7cee                     jl 0x4ed887
004ed899 c3                       ret
004ed89a cc                       int3
004ed89b cc                       int3
004ed89c cc                       int3
004ed89d cc                       int3
004ed89e cc                       int3
004ed89f cc                       int3
; pre_record_data_delivery [00484c9a,00484ce9)
00484c9a 8b150cdf5900             mov edx, dword ptr [0x59df0c]
00484ca0 b8e4038a00               mov eax, 0x8a03e4
00484ca5 b900400000               mov ecx, 0x4000
00484caa 668b32                   mov si, word ptr [edx]
00484cad 83c010                   add eax, 0x10
00484cb0 668970f4                 mov word ptr [eax - 0xc], si
00484cb4 83c202                   add edx, 2
00484cb7 49                       dec ecx
00484cb8 75f0                     jne 0x484caa
00484cba 6a00                     push 0
00484cbc 6a40                     push 0x40
00484cbe 6a00                     push 0
00484cc0 e82b91fcff               call 0x44ddf0
00484cc5 83c40c                   add esp, 0xc
00484cc8 6a40                     push 0x40
00484cca 6a00                     push 0
00484ccc e88fddf9ff               call 0x422a60
00484cd1 83c408                   add esp, 8
00484cd4 e847f00100               call 0x4a3d20
00484cd9 8d442418                 lea eax, [esp + 0x18]
00484cdd 8b0d0cdf5900             mov ecx, dword ptr [0x59df0c]
00484ce3 8b542414                 mov edx, dword ptr [esp + 0x14]
00484ce7 50                       push eax
; canonical_flag_tribe_sun_delivery [00484da9,00484e92)
00484da9 8b150cdf5900             mov edx, dword ptr [0x59df0c]
00484daf b9e4038a00               mov ecx, 0x8a03e4
00484db4 b800400000               mov eax, 0x4000
00484db9 803a00                   cmp byte ptr [edx], 0
00484dbc 7403                     je 0x484dc1
00484dbe 830904                   or dword ptr [ecx], 4
00484dc1 83c110                   add ecx, 0x10
00484dc4 42                       inc edx
00484dc5 48                       dec eax
00484dc6 75f1                     jne 0x484db9
00484dc8 e853ef0100               call 0x4a3d20
00484dcd 8d442418                 lea eax, [esp + 0x18]
00484dd1 8b0d0cdf5900             mov ecx, dword ptr [0x59df0c]
00484dd7 8b542414                 mov edx, dword ptr [esp + 0x14]
00484ddb 50                       push eax
00484ddc 6a40                     push 0x40
00484dde 51                       push ecx
00484ddf 52                       push edx
00484de0 e89b170a00               call 0x526580
00484de5 83c410                   add esp, 0x10
00484de8 837c241840               cmp dword ptr [esp + 0x18], 0x40
00484ded 741a                     je 0x484e09
00484def 8b442414                 mov eax, dword ptr [esp + 0x14]
00484df3 50                       push eax
00484df4 e877150a00               call 0x526370
00484df9 83c404                   add esp, 4
00484dfc 33c0                     xor eax, eax
00484dfe 5d                       pop ebp
00484dff 5f                       pop edi
00484e00 5e                       pop esi
00484e01 5b                       pop ebx
00484e02 81c460020000             add esp, 0x260
00484e08 c3                       ret
00484e09 8b150cdf5900             mov edx, dword ptr [0x59df0c]
00484e0f b969da8900               mov ecx, 0x89da69
00484e14 668b02                   mov ax, word ptr [edx]
00484e17 81c1650c0000             add ecx, 0xc65
00484e1d 6689819bf3ffff           mov word ptr [ecx - 0xc65], ax
00484e24 83c210                   add edx, 0x10
00484e27 668b5af2                 mov bx, word ptr [edx - 0xe]
00484e2b 81f9fd0b8a00             cmp ecx, 0x8a0bfd
00484e31 6689999df3ffff           mov word ptr [ecx - 0xc63], bx
00484e38 72da                     jb 0x484e14
00484e3a e8e1ee0100               call 0x4a3d20
00484e3f 8d442418                 lea eax, [esp + 0x18]
00484e43 8b0d0cdf5900             mov ecx, dword ptr [0x59df0c]
00484e49 8b542414                 mov edx, dword ptr [esp + 0x14]
00484e4d 50                       push eax
00484e4e 6a03                     push 3
00484e50 51                       push ecx
00484e51 52                       push edx
00484e52 e829170a00               call 0x526580
00484e57 83c410                   add esp, 0x10
00484e5a 837c241803               cmp dword ptr [esp + 0x18], 3
00484e5f 741a                     je 0x484e7b
00484e61 8b442414                 mov eax, dword ptr [esp + 0x14]
00484e65 50                       push eax
00484e66 e805150a00               call 0x526370
00484e6b 83c404                   add esp, 4
00484e6e 33c0                     xor eax, eax
00484e70 5d                       pop ebp
00484e71 5f                       pop edi
00484e72 5e                       pop esi
00484e73 5b                       pop ebx
00484e74 81c460020000             add esp, 0x260
00484e7a c3                       ret
00484e7b a10cdf5900               mov eax, dword ptr [0x59df0c]
00484e80 bf01000000               mov edi, 1
00484e85 8a4002                   mov al, byte ptr [eax + 2]
00484e88 a2b07a9300               mov byte ptr [0x937ab0], al
00484e8d e8fec1f7ff               call 0x401090
; composed_roster_site_order_slice [0042b403,0042b48a)
0042b403 e8b8160c00               call 0x4ecac0
0042b408 e8237e0d00               call 0x503230
0042b40d 8b0d76bc8900             mov ecx, dword ptr [0x89bc76]
0042b413 b8c8d18900               mov eax, 0x89d1c8
0042b418 ba06000000               mov edx, 6
0042b41d 890d7eaa9600             mov dword ptr [0x96aa7e], ecx
0042b423 b904000000               mov ecx, 4
0042b428 899021090000             mov dword ptr [eax + 0x921], edx
0042b42e 05650c0000               add eax, 0xc65
0042b433 49                       dec ecx
0042b434 75f2                     jne 0x42b428
0042b436 33f6                     xor esi, esi
0042b438 bfc8d18900               mov edi, 0x89d1c8
0042b43d 803dc0ea960000           cmp byte ptr [0x96eac0], 0
0042b444 7644                     jbe 0x42b48a
0042b446 bb00020000               mov ebx, 0x200
0042b44b 57                       push edi
0042b44c e83fe3feff               call 0x419790
0042b451 83c404                   add esp, 4
0042b454 851d65c68900             test dword ptr [0x89c665], ebx
0042b45a 751c                     jne 0x42b478
0042b45c 57                       push edi
0042b45d e8aee3feff               call 0x419810
0042b462 83c404                   add esp, 4
0042b465 57                       push edi
0042b466 e815e4feff               call 0x419880
0042b46b 81a73d090000fffffeff     and dword ptr [edi + 0x93d], 0xfffeffff
0042b475 83c404                   add esp, 4
0042b478 46                       inc esi
0042b479 81c7650c0000             add edi, 0xc65
0042b47f 33c0                     xor eax, eax
0042b481 a0c0ea9600               mov al, byte ptr [0x96eac0]
0042b486 3bc6                     cmp eax, esi
0042b488 7fc1                     jg 0x42b44b
; fresh_tribe_reset_owner [0042b7f0,0042b909)
0042b7f0 56                       push esi
0042b7f1 b98d798900               mov ecx, 0x89798d
0042b7f6 57                       push edi
0042b7f7 33c0                     xor eax, eax
0042b7f9 bac8d18900               mov edx, 0x89d1c8
0042b7fe 8901                     mov dword ptr [ecx], eax
0042b800 894104                   mov dword ptr [ecx + 4], eax
0042b803 66894108                 mov word ptr [ecx + 8], ax
0042b807 b9c7268900               mov ecx, 0x8926c7
0042b80c a3c7268900               mov dword ptr [0x8926c7], eax
0042b811 894104                   mov dword ptr [ecx + 4], eax
0042b814 8d8a270a0000             lea ecx, [edx + 0xa27]
0042b81a 8dba4b0a0000             lea edi, [edx + 0xa4b]
0042b820 8882200c0000             mov byte ptr [edx + 0xc20], al
0042b826 81c2650c0000             add edx, 0xc65
0042b82c 81fa5c038a00             cmp edx, 0x8a035c
0042b832 8982e4fcffff             mov dword ptr [edx - 0x31c], eax
0042b838 8982b8fcffff             mov dword ptr [edx - 0x348], eax
0042b83e 8982c0fcffff             mov dword ptr [edx - 0x340], eax
0042b844 898220fcffff             mov dword ptr [edx - 0x3e0], eax
0042b84a 89821cfcffff             mov dword ptr [edx - 0x3e4], eax
0042b850 8982e0fcffff             mov dword ptr [edx - 0x320], eax
0042b856 8982e8fcffff             mov dword ptr [edx - 0x318], eax
0042b85c 8901                     mov dword ptr [ecx], eax
0042b85e 894104                   mov dword ptr [ecx + 4], eax
0042b861 894108                   mov dword ptr [ecx + 8], eax
0042b864 89410c                   mov dword ptr [ecx + 0xc], eax
0042b867 66894110                 mov word ptr [ecx + 0x10], ax
0042b86b 8d8ad4fdffff             lea ecx, [edx - 0x22c]
0042b871 8901                     mov dword ptr [ecx], eax
0042b873 894104                   mov dword ptr [ecx + 4], eax
0042b876 894108                   mov dword ptr [ecx + 8], eax
0042b879 89410c                   mov dword ptr [ecx + 0xc], eax
0042b87c 66894110                 mov word ptr [ecx + 0x10], ax
0042b880 b916000000               mov ecx, 0x16
0042b885 f3ab                     rep stosd dword ptr es:[edi], eax
0042b887 66ab                     stosw word ptr es:[edi], ax
0042b889 8dba40feffff             lea edi, [edx - 0x1c0]
0042b88f b91b000000               mov ecx, 0x1b
0042b894 f3ab                     rep stosd dword ptr es:[edi], eax
0042b896 8dbaacfeffff             lea edi, [edx - 0x154]
0042b89c b91b000000               mov ecx, 0x1b
0042b8a1 f3ab                     rep stosd dword ptr es:[edi], eax
0042b8a3 8dba18ffffff             lea edi, [edx - 0xe8]
0042b8a9 b90a000000               mov ecx, 0xa
0042b8ae f3ab                     rep stosd dword ptr es:[edi], eax
0042b8b0 8d8a40ffffff             lea ecx, [edx - 0xc0]
0042b8b6 8dba4affffff             lea edi, [edx - 0xb6]
0042b8bc 8901                     mov dword ptr [ecx], eax
0042b8be 894104                   mov dword ptr [ecx + 4], eax
0042b8c1 66894108                 mov word ptr [ecx + 8], ax
0042b8c5 b90a000000               mov ecx, 0xa
0042b8ca f3ab                     rep stosd dword ptr es:[edi], eax
0042b8cc 0f8242ffffff             jb 0x42b814
0042b8d2 33ff                     xor edi, edi
0042b8d4 803dc0ea960000           cmp byte ptr [0x96eac0], 0
0042b8db 7629                     jbe 0x42b906
0042b8dd bec8d18900               mov esi, 0x89d1c8
0042b8e2 57                       push edi
0042b8e3 e878fdffff               call 0x42b660
0042b8e8 83c404                   add esp, 4
0042b8eb 47                       inc edi
0042b8ec 56                       push esi
0042b8ed e8feb60000               call 0x436ff0
0042b8f2 83c404                   add esp, 4
0042b8f5 81c6650c0000             add esi, 0xc65
0042b8fb 33c0                     xor eax, eax
0042b8fd a0c0ea9600               mov al, byte ptr [0x96eac0]
0042b902 3bc7                     cmp eax, edi
0042b904 7fdc                     jg 0x42b8e2
0042b906 5f                       pop edi
0042b907 5e                       pop esi
0042b908 c3                       ret
; native_sunlight_entry [00401090,004010ac)
00401090 b893000000               mov eax, 0x93
00401095 66a3a87a9300             mov word ptr [0x937aa8], ax
0040109b 66a3ac7a9300             mov word ptr [0x937aac], ax
004010a1 66a3aa7a9300             mov word ptr [0x937aaa], ax
004010a7 e9e4060000               jmp 0x401790
; post_load_header_stores [0042b3ea,0042b403)
0042b3ea 8a442418                 mov al, byte ptr [esp + 0x18]
0042b3ee 8a4c241c                 mov cl, byte ptr [esp + 0x1c]
0042b3f2 881dd0ea9600             mov byte ptr [0x96ead0], bl
0042b3f8 a2d1ea9600               mov byte ptr [0x96ead1], al
0042b3fd 880dd2ea9600             mov byte ptr [0x96ead2], cl
; link_tail_owner_count_finalization [00485122,00485153)
00485122 6a40                     push 0x40
00485124 6a00                     push 0
00485126 e8158c0300               call 0x4bdd40
0048512b 8d442434                 lea eax, [esp + 0x34]
0048512f 83c408                   add esp, 8
00485132 b911db8900               mov ecx, 0x89db11
00485137 833800                   cmp dword ptr [eax], 0
0048513a 7506                     jne 0x485142
0048513c c70161000000             mov dword ptr [ecx], 0x61
00485142 81c1650c0000             add ecx, 0xc65
00485148 83c004                   add eax, 4
0048514b 8d54243c                 lea edx, [esp + 0x3c]
0048514f 3bc2                     cmp eax, edx
00485151 72e4                     jb 0x485137
; real_brightness_writer [004be230,004be327)
004be230 668b542404               mov dx, word ptr [esp + 4]
004be235 83ec04                   sub esp, 4
004be238 33c0                     xor eax, eax
004be23a 53                       push ebx
004be23b 668bc2                   mov ax, dx
004be23e 56                       push esi
004be23f 57                       push edi
004be240 25fe000000               and eax, 0xfe
004be245 668954240e               mov word ptr [esp + 0xe], dx
004be24a 03c0                     add eax, eax
004be24c 33c9                     xor ecx, ecx
004be24e 668bca                   mov cx, dx
004be251 81e100fe0000             and ecx, 0xfe00
004be257 0bc1                     or eax, ecx
004be259 0fbf3485e8038a00         movsx esi, word ptr [eax*4 + 0x8a03e8]
004be261 8d0c85e4038a00           lea ecx, [eax*4 + 0x8a03e4]
004be268 8ac2                     mov al, dl
004be26a 0402                     add al, 2
004be26c 8bd6                     mov edx, esi
004be26e 33ff                     xor edi, edi
004be270 8844240e                 mov byte ptr [esp + 0xe], al
004be274 668b7c240e               mov di, word ptr [esp + 0xe]
004be279 33c0                     xor eax, eax
004be27b 668b44240e               mov ax, word ptr [esp + 0xe]
004be280 81e700fe0000             and edi, 0xfe00
004be286 806c240e02               sub byte ptr [esp + 0xe], 2
004be28b 25fe000000               and eax, 0xfe
004be290 03c0                     add eax, eax
004be292 0bc7                     or eax, edi
004be294 33ff                     xor edi, edi
004be296 8044240f02               add byte ptr [esp + 0xf], 2
004be29b 0fbf1c85e8038a00         movsx ebx, word ptr [eax*4 + 0x8a03e8]
004be2a3 668b7c240e               mov di, word ptr [esp + 0xe]
004be2a8 2bd3                     sub edx, ebx
004be2aa 33c0                     xor eax, eax
004be2ac 81e700fe0000             and edi, 0xfe00
004be2b2 668b44240e               mov ax, word ptr [esp + 0xe]
004be2b7 25fe000000               and eax, 0xfe
004be2bc 03c0                     add eax, eax
004be2be 0bc7                     or eax, edi
004be2c0 0fbf3c85e8038a00         movsx edi, word ptr [eax*4 + 0x8a03e8]
004be2c8 2bfe                     sub edi, esi
004be2ca be5e010000               mov esi, 0x15e
004be2cf 0fbf05aa7a9300           movsx eax, word ptr [0x937aaa]
004be2d6 0faff8                   imul edi, eax
004be2d9 0fbf05a87a9300           movsx eax, word ptr [0x937aa8]
004be2e0 0fafc2                   imul eax, edx
004be2e3 2bf8                     sub edi, eax
004be2e5 33db                     xor ebx, ebx
004be2e7 0fbf05ac7a9300           movsx eax, word ptr [0x937aac]
004be2ee 03c7                     add eax, edi
004be2f0 99                       cdq
004be2f1 f7fe                     idiv esi
004be2f3 8a510e                   mov dl, byte ptr [ecx + 0xe]
004be2f6 80e20f                   and dl, 0xf
004be2f9 8ada                     mov bl, dl
004be2fb 83c308                   add ebx, 8
004be2fe c1e304                   shl ebx, 4
004be301 03c3                     add eax, ebx
004be303 790c                     jns 0x4be311
004be305 33c0                     xor eax, eax
004be307 5f                       pop edi
004be308 5e                       pop esi
004be309 88410d                   mov byte ptr [ecx + 0xd], al
004be30c 5b                       pop ebx
004be30d 83c404                   add esp, 4
004be310 c3                       ret
004be311 3d00010000               cmp eax, 0x100
004be316 7c05                     jl 0x4be31d
004be318 b8ff000000               mov eax, 0xff
004be31d 5f                       pop edi
004be31e 88410d                   mov byte ptr [ecx + 0xd], al
004be321 5e                       pop esi
004be322 5b                       pop ebx
004be323 83c404                   add esp, 4
004be326 c3                       ret
; pre_record_landscape_bank_store [0042b34e,0042b372)
0042b34e 0fbe053dce8900           movsx eax, byte ptr [0x89ce3d]
0042b355 8b5c2414                 mov ebx, dword ptr [esp + 0x14]
0042b359 3bc3                     cmp eax, ebx
0042b35b 7456                     je 0x42b3b3
0042b35d 53                       push ebx
0042b35e 881d3dce8900             mov byte ptr [0x89ce3d], bl
0042b364 881dd0ea9600             mov byte ptr [0x96ead0], bl
0042b36a e8d1edffff               call 0x42a140
0042b36f 83c404                   add esp, 4
