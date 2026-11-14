004ad035: 6a00                 push 0
004ad037: 80c37d               add bl, 0x7d
004ad03a: 6a00                 push 0
004ad03c: 6a00                 push 0
004ad03e: 53                   push ebx
004ad03f: e80cf3fcff           call 0x47c350
004ad044: 83c410               add esp, 0x10
004ad047: 5d                   pop ebp
004ad048: 5f                   pop edi
004ad049: 5e                   pop esi
004ad04a: 5b                   pop ebx
004ad04b: 81c43c030000         add esp, 0x33c
004ad051: c3                   ret 
004ad052: 803dae45980000       cmp byte ptr [0x9845ae], 0
004ad059: b801000000           mov eax, 1
004ad05e: 7409                 je 0x4ad069
004ad060: 803dae46980000       cmp byte ptr [0x9846ae], 0
004ad067: 7412                 je 0x4ad07b
004ad069: 803d2e46980000       cmp byte ptr [0x98462e], 0
004ad070: 740b                 je 0x4ad07d
004ad072: 803d2e47980000       cmp byte ptr [0x98472e], 0
004ad079: 7502                 jne 0x4ad07d
004ad07b: 33c0                 xor eax, eax
004ad07d: 50                   push eax
004ad07e: 80c377               add bl, 0x77
004ad081: 6a00                 push 0
004ad083: 6a01                 push 1
004ad085: 53                   push ebx
004ad086: e8c5f2fcff           call 0x47c350
004ad08b: 83c410               add esp, 0x10
004ad08e: 5d                   pop ebp
004ad08f: 5f                   pop edi
004ad090: 5e                   pop esi
004ad091: 5b                   pop ebx
004ad092: 81c43c030000         add esp, 0x33c
004ad098: c3                   ret 
004ad099: 803dae45980000       cmp byte ptr [0x9845ae], 0
004ad0a0: b801000000           mov eax, 1
004ad0a5: 7409                 je 0x4ad0b0
004ad0a7: 803dae46980000       cmp byte ptr [0x9846ae], 0
004ad0ae: 7412                 je 0x4ad0c2
004ad0b0: 803d2e46980000       cmp byte ptr [0x98462e], 0
004ad0b7: 740b                 je 0x4ad0c4
004ad0b9: 803d2e47980000       cmp byte ptr [0x98472e], 0
004ad0c0: 7502                 jne 0x4ad0c4
004ad0c2: 33c0                 xor eax, eax
004ad0c4: 50                   push eax
004ad0c5: 80c371               add bl, 0x71
004ad0c8: 6a01                 push 1
004ad0ca: 6a01                 push 1
004ad0cc: 53                   push ebx
004ad0cd: e87ef2fcff           call 0x47c350
004ad0d2: 83c410               add esp, 0x10
004ad0d5: 5d                   pop ebp
004ad0d6: 5f                   pop edi
004ad0d7: 5e                   pop esi
004ad0d8: 5b                   pop ebx
004ad0d9: 81c43c030000         add esp, 0x33c
004ad0df: c3                   ret 
004ad0e0: 0fbe0df0c68900       movsx ecx, byte ptr [0x89c6f0]
004ad0e7: 8bc1                 mov eax, ecx
004ad0e9: 8d1489               lea edx, [ecx + ecx*4]
004ad0ec: 8d0c50               lea ecx, [eax + edx*2]
004ad0ef: 8d1cc9               lea ebx, [ecx + ecx*8]
004ad0f2: 8d14d8               lea edx, [eax + ebx*8]
004ad0f5: 668b8c90d9da8900     mov cx, word ptr [eax + edx*4 + 0x89dad9]
004ad0fd: 8d0490               lea eax, [eax + edx*4]
004ad100: 66c1e908             shr cx, 8
004ad104: 80e1fe               and cl, 0xfe
004ad107: 884c242c             mov byte ptr [esp + 0x2c], cl
004ad10b: 668b88dbda8900       mov cx, word ptr [eax + 0x89dadb]
004ad112: 0fbf80fad18900       movsx eax, word ptr [eax + 0x89d1fa]
004ad119: 66c1e908             shr cx, 8
004ad11d: 50                   push eax
004ad11e: 80e1fe               and cl, 0xfe
004ad121: 884c2431             mov byte ptr [esp + 0x31], cl
004ad125: 8b442430             mov eax, dword ptr [esp + 0x30]
004ad129: 25ffff0000           and eax, 0xffff
004ad12e: 50                   push eax
004ad12f: 6a16                 push 0x16
004ad131: e89accfcff           call 0x479dd0
004ad136: 83c40c               add esp, 0xc
004ad139: 5d                   pop ebp
004ad13a: 5f                   pop edi
004ad13b: 5e                   pop esi
004ad13c: 5b                   pop ebx
004ad13d: 81c43c030000         add esp, 0x33c
004ad143: c3                   ret 
004ad144: 6a00                 push 0
004ad146: 6a00                 push 0
004ad148: 6a01                 push 1
004ad14a: 6a00                 push 0
004ad14c: e8fff1fcff           call 0x47c350
004ad151: 83c410               add esp, 0x10
004ad154: 5d                   pop ebp
004ad155: 5f                   pop edi
004ad156: 5e                   pop esi
004ad157: 5b                   pop ebx
004ad158: 81c43c030000         add esp, 0x33c
004ad15e: c3                   ret 
