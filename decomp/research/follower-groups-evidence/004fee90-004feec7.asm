004fee90: f6057cd1890020       test byte ptr [0x89d17c], 0x20
004fee97: 752b                 jne 0x4feec4
004fee99: 66833dc1c6890002     cmp word ptr [0x89c6c1], 2
004feea1: 7421                 je 0x4feec4
004feea3: 803d36ce890000       cmp byte ptr [0x89ce36], 0
004feeaa: 7518                 jne 0x4feec4
004feeac: 803de7c6890009       cmp byte ptr [0x89c6e7], 9
004feeb3: 740f                 je 0x4feec4
004feeb5: 803de7c689000f       cmp byte ptr [0x89c6e7], 0xf
004feebc: 7406                 je 0x4feec4
004feebe: b801000000           mov eax, 1
004feec3: c3                   ret 
004feec4: 33c0                 xor eax, eax
004feec6: c3                   ret 
