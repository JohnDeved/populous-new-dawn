004a4737 33c0                     xor      eax, eax
004a4739 a000f08800               mov      al, byte ptr [0x88f000]
004a473e 83e802                   sub      eax, 2
004a4741 83f80a                   cmp      eax, 0xa
004a4744 7730                     ja       0x4a4776
004a4746 33c9                     xor      ecx, ecx
004a4748 8a8854494a00             mov      cl, byte ptr [eax + 0x4a4954]
004a474e ff248d38494a00           jmp      dword ptr [ecx*4 + 0x4a4938]
004a4755 e806020000               call     0x4a4960
004a475a eb1a                     jmp      0x4a4776
004a475c e8ff32fbff               call     0x457a60
004a4761 eb13                     jmp      0x4a4776
004a4763 e8b8c6f6ff               call     0x410e20
004a4768 eb0c                     jmp      0x4a4776
004a476a e881060000               call     0x4a4df0
004a476f eb05                     jmp      0x4a4776
004a4771 e80a4c0000               call     0x4a9380
