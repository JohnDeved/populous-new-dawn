004a99d0 0fbf05d1c68900           movsx    eax, word ptr [0x89c6d1]
004a99d7 81ec24020000             sub      esp, 0x224
004a99dd 40                       inc      eax
004a99de a3ece79800               mov      dword ptr [0x98e7ec], eax
004a99e3 53                       push     ebx
004a99e4 56                       push     esi
004a99e5 33db                     xor      ebx, ebx
004a99e7 57                       push     edi
004a99e8 881d81469800             mov      byte ptr [0x984681], bl
004a99ee 55                       push     ebp
004a99ef 881d81479800             mov      byte ptr [0x984781], bl
004a99f5 881d83469800             mov      byte ptr [0x984683], bl
004a99fb 881d83479800             mov      byte ptr [0x984783], bl
004a9a01 881d82469800             mov      byte ptr [0x984682], bl
004a9a07 881d82479800             mov      byte ptr [0x984782], bl
004a9a0d 833d48db5c0001           cmp      dword ptr [0x5cdb48], 1
004a9a14 0f84c1010000             je       0x4a9bdb
004a9a1a 8d442414                 lea      eax, [esp + 0x14]
004a9a1e 53                       push     ebx
004a9a1f c70548db5c0001000000     mov      dword ptr [0x5cdb48], 1
004a9a29 68489b5900               push     0x599b48
004a9a2e 50                       push     eax
004a9a2f e8ac650500               call     0x4fffe0
004a9a34 8d442420                 lea      eax, [esp + 0x20]
004a9a38 8d8c2430010000           lea      ecx, [esp + 0x130]
004a9a3f 83c40c                   add      esp, 0xc
004a9a42 50                       push     eax
004a9a43 6860db5c00               push     0x5cdb60
004a9a48 51                       push     ecx
004a9a49 e8021a0b00               call     0x55b450
004a9a4e 83c40c                   add      esp, 0xc
004a9a51 e8caa2ffff               call     0x4a3d20
004a9a56 8d8c2424010000           lea      ecx, [esp + 0x124]
004a9a5d 68ac845900               push     0x5984ac
004a9a62 51                       push     ecx
004a9a63 e888170b00               call     0x55b1f0
004a9a68 83c408                   add      esp, 8
004a9a6b 8bf8                     mov      edi, eax
004a9a6d 85ff                     test     edi, edi
004a9a6f 751c                     jne      0x4a9a8d
004a9a71 68ac845900               push     0x5984ac
004a9a76 684cdb5c00               push     0x5cdb4c
004a9a7b e870170b00               call     0x55b1f0
004a9a80 83c408                   add      esp, 8
004a9a83 8bf8                     mov      edi, eax
004a9a85 85ff                     test     edi, edi
004a9a87 0f844e010000             je       0x4a9bdb
004a9a8d 6a02                     push     2
004a9a8f 6a00                     push     0
004a9a91 57                       push     edi
004a9a92 e859140b00               call     0x55aef0
004a9a97 83c40c                   add      esp, 0xc
004a9a9a 57                       push     edi
004a9a9b e830150b00               call     0x55afd0
004a9aa0 89442414                 mov      dword ptr [esp + 0x14], eax
004a9aa4 83c404                   add      esp, 4
004a9aa7 6a00                     push     0
004a9aa9 6a00                     push     0
004a9aab 57                       push     edi
004a9aac e83f140b00               call     0x55aef0
004a9ab1 8b5c241c                 mov      ebx, dword ptr [esp + 0x1c]
004a9ab5 83c40c                   add      esp, 0xc
004a9ab8 8d045d00000000           lea      eax, [ebx*2]
004a9abf 50                       push     eax
004a9ac0 e8db110b00               call     0x55aca0
004a9ac5 83c404                   add      esp, 4
004a9ac8 8bf0                     mov      esi, eax
004a9aca a3f0e79800               mov      dword ptr [0x98e7f0], eax
004a9acf 837c241000               cmp      dword ptr [esp + 0x10], 0
004a9ad4 7e13                     jle      0x4a9ae9
004a9ad6 57                       push     edi
004a9ad7 83c602                   add      esi, 2
004a9ada e8013a0b00               call     0x55d4e0
004a9adf 668946fe                 mov      word ptr [esi - 2], ax
004a9ae3 83c404                   add      esp, 4
004a9ae6 4b                       dec      ebx
004a9ae7 75ed                     jne      0x4a9ad6
004a9ae9 57                       push     edi
004a9aea 33f6                     xor      esi, esi
004a9aec e8bf110b00               call     0x55acb0
004a9af1 83c404                   add      esp, 4
004a9af4 8b1df0e79800             mov      ebx, dword ptr [0x98e7f0]
004a9afa 8bfb                     mov      edi, ebx
004a9afc 6a0a                     push     0xa
004a9afe e89d110b00               call     0x55aca0
004a9b03 83c404                   add      esp, 4
004a9b06 8be8                     mov      ebp, eax
004a9b08 85ed                     test     ebp, ebp
004a9b0a 0f84cb000000             je       0x4a9bdb
004a9b10 897502                   mov      dword ptr [ebp + 2], esi
004a9b13 39742410                 cmp      dword ptr [esp + 0x10], esi
004a9b17 66897500                 mov      word ptr [ebp], si
004a9b1b 897506                   mov      dword ptr [ebp + 6], esi
004a9b1e 892df4e79800             mov      dword ptr [0x98e7f4], ebp
004a9b24 0f8eac000000             jle      0x4a9bd6
004a9b2a 668b07                   mov      ax, word ptr [edi]
004a9b2d 663d3000                 cmp      ax, 0x30
004a9b31 723b                     jb       0x4a9b6e
004a9b33 663d3900                 cmp      ax, 0x39
004a9b37 7735                     ja       0x4a9b6e
004a9b39 33c0                     xor      eax, eax
004a9b3b 3b742410                 cmp      esi, dword ptr [esp + 0x10]
004a9b3f 7d23                     jge      0x4a9b64
004a9b41 668b0f                   mov      cx, word ptr [edi]
004a9b44 6683f930                 cmp      cx, 0x30
004a9b48 721a                     jb       0x4a9b64
004a9b4a 6683f939                 cmp      cx, 0x39
004a9b4e 7714                     ja       0x4a9b64
004a9b50 8d1480                   lea      edx, [eax + eax*4]
004a9b53 83c702                   add      edi, 2
004a9b56 0fb7c1                   movzx    eax, cx
004a9b59 46                       inc      esi
004a9b5a 8d4450d0                 lea      eax, [eax + edx*2 - 0x30]
004a9b5e 3b742410                 cmp      esi, dword ptr [esp + 0x10]
004a9b62 7cdd                     jl       0x4a9b41
004a9b64 66052f04                 add      ax, 0x42f
004a9b68 66894500                 mov      word ptr [ebp], ax
004a9b6c eb5e                     jmp      0x4a9bcc
004a9b6e 663d0d00                 cmp      ax, 0xd
004a9b72 752f                     jne      0x4a9ba3
004a9b74 837d0200                 cmp      dword ptr [ebp + 2], 0
004a9b78 744e                     je       0x4a9bc8
004a9b7a 6a0a                     push     0xa
004a9b7c e81f110b00               call     0x55aca0
004a9b81 83c404                   add      esp, 4
004a9b84 894506                   mov      dword ptr [ebp + 6], eax
004a9b87 8be8                     mov      ebp, eax
004a9b89 85ed                     test     ebp, ebp
004a9b8b 744e                     je       0x4a9bdb
004a9b8d c7450200000000           mov      dword ptr [ebp + 2], 0
004a9b94 66c745000000             mov      word ptr [ebp], 0
004a9b9a c7450600000000           mov      dword ptr [ebp + 6], 0
004a9ba1 eb25                     jmp      0x4a9bc8
004a9ba3 663d2000                 cmp      ax, 0x20
004a9ba7 721f                     jb       0x4a9bc8
004a9ba9 837d0200                 cmp      dword ptr [ebp + 2], 0
004a9bad 750b                     jne      0x4a9bba
004a9baf 66c7030000               mov      word ptr [ebx], 0
004a9bb4 83c302                   add      ebx, 2
004a9bb7 895d02                   mov      dword ptr [ebp + 2], ebx
004a9bba 668b07                   mov      ax, word ptr [edi]
004a9bbd 83c702                   add      edi, 2
004a9bc0 668903                   mov      word ptr [ebx], ax
004a9bc3 83c302                   add      ebx, 2
004a9bc6 eb03                     jmp      0x4a9bcb
004a9bc8 83c702                   add      edi, 2
004a9bcb 46                       inc      esi
004a9bcc 3b742410                 cmp      esi, dword ptr [esp + 0x10]
004a9bd0 0f8c54ffffff             jl       0x4a9b2a
004a9bd6 66c7030000               mov      word ptr [ebx], 0
004a9bdb 5d                       pop      ebp
004a9bdc 5f                       pop      edi
004a9bdd 5e                       pop      esi
004a9bde 5b                       pop      ebx
004a9bdf 81c424020000             add      esp, 0x224
004a9be5 c3                       ret
