00443b40 0fbe442404           movsx eax, byte ptr [esp + 4]
00443b45 83ec0c               sub esp, 0xc
00443b48 8bc8                 mov ecx, eax
00443b4a 8d1480               lea edx, [eax + eax*4]
00443b4d 53                   push ebx
00443b4e 56                   push esi
00443b4f 57                   push edi
00443b50 55                   push ebp
00443b51 8d0451               lea eax, [ecx + edx*2]
00443b54 8d1cc0               lea ebx, [eax + eax*8]
00443b57 8d14d9               lea edx, [ecx + ebx*8]
00443b5a 8d8491c8d18900       lea eax, [ecx + edx*4 + 0x89d1c8]
00443b61 8b8c9165da8900       mov ecx, dword ptr [ecx + edx*4 + 0x89da65]
00443b68 894c2410             mov dword ptr [esp + 0x10], ecx
00443b6c 85c9                 test ecx, ecx
00443b6e 0f84ab010000         je 0x443d1f
00443b74 33d2                 xor edx, edx
00443b76 8bb081080000         mov esi, dword ptr [eax + 0x881]
00443b7c 668b5124             mov dx, word ptr [ecx + 0x24]
00443b80 8bc6                 mov eax, esi
00443b82 33c9                 xor ecx, ecx
00443b84 89542414             mov dword ptr [esp + 0x14], edx
00443b88 85c0                 test eax, eax
00443b8a 7418                 je 0x443ba4
00443b8c ba80000000           mov edx, 0x80
00443b91 84507a               test byte ptr [eax + 0x7a], dl
00443b94 7407                 je 0x443b9d
00443b96 39442410             cmp dword ptr [esp + 0x10], eax
00443b9a 7401                 je 0x443b9d
00443b9c 41                   inc ecx
00443b9d 8b4008               mov eax, dword ptr [eax + 8]
00443ba0 85c0                 test eax, eax
00443ba2 75ed                 jne 0x443b91
00443ba4 33db                 xor ebx, ebx
00443ba6 85c9                 test ecx, ecx
00443ba8 0f8411010000         je 0x443cbf
00443bae 33ff                 xor edi, edi
00443bb0 85f6                 test esi, esi
00443bb2 0f8467010000         je 0x443d1f
00443bb8 f6467a80             test byte ptr [esi + 0x7a], 0x80
00443bbc 0f84ea000000         je 0x443cac
00443bc2 39742410             cmp dword ptr [esp + 0x10], esi
00443bc6 0f84e0000000         je 0x443cac
00443bcc 85ff                 test edi, edi
00443bce 7527                 jne 0x443bf7
00443bd0 e84b30ffff           call 0x436c20
00443bd5 0fb7f8               movzx edi, ax
00443bd8 85ff                 test edi, edi
00443bda 741b                 je 0x443bf7
00443bdc 668b442414           mov ax, word ptr [esp + 0x14]
00443be1 53                   push ebx
00443be2 668944241c           mov word ptr [esp + 0x1c], ax
00443be7 8d44241c             lea eax, [esp + 0x1c]
00443beb 50                   push eax
00443bec 6a1e                 push 0x1e
00443bee 57                   push edi
00443bef e83c4bffff           call 0x438730
00443bf4 83c410               add esp, 0x10
00443bf7 834e0c10             or dword ptr [esi + 0xc], 0x10
00443bfb 56                   push esi
00443bfc e89f30ffff           call 0x436ca0
00443c01 83c404               add esp, 4
00443c04 53                   push ebx
00443c05 57                   push edi
00443c06 56                   push esi
00443c07 e8f430ffff           call 0x436d00
00443c0c 83c40c               add esp, 0xc
00443c0f 385c2424             cmp byte ptr [esp + 0x24], bl
00443c13 0f8593000000         jne 0x443cac
00443c19 8166147fffffff       and dword ptr [esi + 0x14], 0xffffff7f
00443c20 80667a7f             and byte ptr [esi + 0x7a], 0x7f
00443c24 668b869f000000       mov ax, word ptr [esi + 0x9f]
00443c2b 6685c0               test ax, ax
00443c2e 747c                 je 0x443cac
00443c30 0fb7c0               movzx eax, ax
00443c33 33c9                 xor ecx, ecx
00443c35 8b048590038900       mov eax, dword ptr [eax*4 + 0x890390]
00443c3c f6400c01             test byte ptr [eax + 0xc], 1
00443c40 7507                 jne 0x443c49
00443c42 38582a               cmp byte ptr [eax + 0x2a], bl
00443c45 7402                 je 0x443c49
00443c47 8bc8                 mov ecx, eax
00443c49 85c9                 test ecx, ecx
00443c4b 745f                 je 0x443cac
00443c4d 38999e000000         cmp byte ptr [ecx + 0x9e], bl
00443c53 7457                 je 0x443cac
00443c55 33c0                 xor eax, eax
00443c57 8a412b               mov al, byte ptr [ecx + 0x2b]
00443c5a 8bd0                 mov edx, eax
00443c5c 8d0440               lea eax, [eax + eax*2]
00443c5f c1e003               shl eax, 3
00443c62 2bc2                 sub eax, edx
00443c64 0fbe9040795a00       movsx edx, byte ptr [eax + 0x5a7940]
00443c6b 85d2                 test edx, edx
00443c6d 7e3d                 jle 0x443cac
00443c6f 83c17a               add ecx, 0x7a
00443c72 668b29               mov bp, word ptr [ecx]
00443c75 33c0                 xor eax, eax
00443c77 663be8               cmp bp, ax
00443c7a 7417                 je 0x443c93
00443c7c 0fb7ed               movzx ebp, bp
00443c7f 8b2cad90038900       mov ebp, dword ptr [ebp*4 + 0x890390]
00443c86 f6450c01             test byte ptr [ebp + 0xc], 1
00443c8a 7507                 jne 0x443c93
00443c8c 385d2a               cmp byte ptr [ebp + 0x2a], bl
00443c8f 7402                 je 0x443c93
00443c91 8bc5                 mov eax, ebp
00443c93 85c0                 test eax, eax
00443c95 740f                 je 0x443ca6
00443c97 3bf0                 cmp esi, eax
00443c99 740b                 je 0x443ca6
00443c9b 8160147fffffff       and dword ptr [eax + 0x14], 0xffffff7f
00443ca2 80607a7f             and byte ptr [eax + 0x7a], 0x7f
00443ca6 83c102               add ecx, 2
00443ca9 4a                   dec edx
00443caa 75c6                 jne 0x443c72
00443cac 8b7608               mov esi, dword ptr [esi + 8]
00443caf 85f6                 test esi, esi
00443cb1 0f8501ffffff         jne 0x443bb8
00443cb7 5d                   pop ebp
00443cb8 5f                   pop edi
00443cb9 5e                   pop esi
00443cba 5b                   pop ebx
00443cbb 83c40c               add esp, 0xc
00443cbe c3                   ret 
00443cbf 85f6                 test esi, esi
00443cc1 745c                 je 0x443d1f
00443cc3 bb0a000000           mov ebx, 0xa
00443cc8 385e2c               cmp byte ptr [esi + 0x2c], bl
00443ccb 754b                 jne 0x443d18
00443ccd 80bea70000001e       cmp byte ptr [esi + 0xa7], 0x1e
00443cd4 7542                 jne 0x443d18
00443cd6 33d2                 xor edx, edx
00443cd8 33c0                 xor eax, eax
00443cda 668b869b000000       mov ax, word ptr [esi + 0x9b]
00443ce1 3bc2                 cmp eax, edx
00443ce3 7516                 jne 0x443cfb
00443ce5 33c9                 xor ecx, ecx
00443ce7 33c0                 xor eax, eax
00443ce9 8a8ea6000000         mov cl, byte ptr [esi + 0xa6]
00443cef 668b844e8b000000     mov ax, word ptr [esi + ecx*2 + 0x8b]
00443cf7 85c0                 test eax, eax
00443cf9 740a                 je 0x443d05
00443cfb 8d0480               lea eax, [eax + eax*4]
00443cfe 8d144530889300       lea edx, [eax*2 + 0x938830]
00443d05 52                   push edx
00443d06 56                   push esi
00443d07 e884f7feff           call 0x433490
00443d0c 83c408               add esp, 8
00443d0f 56                   push esi
00443d10 e88b2fffff           call 0x436ca0
00443d15 83c404               add esp, 4
00443d18 8b7608               mov esi, dword ptr [esi + 8]
00443d1b 85f6                 test esi, esi
00443d1d 75a9                 jne 0x443cc8
00443d1f 5d                   pop ebp
00443d20 5f                   pop edi
00443d21 5e                   pop esi
00443d22 5b                   pop ebx
00443d23 83c40c               add esp, 0xc
00443d26 c3                   ret 
