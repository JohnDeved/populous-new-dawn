00442a60 c605e0de590001           mov      byte ptr [0x59dee0], 1
00442a67 8a4c2404                 mov      cl, byte ptr [esp + 4]
00442a6b 80f907                   cmp      cl, 7
00442a6e 751d                     jne      0x442a8d
00442a70 803d00f0880002           cmp      byte ptr [0x88f000], 2
00442a77 a0ddc68900               mov      al, byte ptr [0x89c6dd]
00442a7c a26ed18900               mov      byte ptr [0x89d16e], al
00442a81 750a                     jne      0x442a8d
00442a83 a090459800               mov      al, byte ptr [0x984590]
00442a88 a2f09c7400               mov      byte ptr [0x749cf0], al
00442a8d 84c9                     test     cl, cl
00442a8f 7406                     je       0x442a97
00442a91 880d01f08800             mov      byte ptr [0x88f001], cl
00442a97 c60502f0880005           mov      byte ptr [0x88f002], 5
00442a9e c60503f0880000           mov      byte ptr [0x88f003], 0
00442aa5 c3                       ret
