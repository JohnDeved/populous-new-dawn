00469515: 8a427a               mov al, byte ptr [edx + 0x7a]
00469518: a87e                 test al, 0x7e
0046951a: 0f8485020000         je 0x4697a5
00469520: 803d68d1890000       cmp byte ptr [0x89d168], 0
00469527: 7531                 jne 0x46955a
00469529: 803d69d1890000       cmp byte ptr [0x89d169], 0
00469530: 7528                 jne 0x46955a
00469532: 803d6ad1890000       cmp byte ptr [0x89d16a], 0
00469539: 751f                 jne 0x46955a
0046953b: 803d6bd1890000       cmp byte ptr [0x89d16b], 0
00469542: 7516                 jne 0x46955a
00469544: 803d6cd1890000       cmp byte ptr [0x89d16c], 0
0046954b: 750d                 jne 0x46955a
0046954d: 803d6dd1890000       cmp byte ptr [0x89d16d], 0
00469554: 0f844b020000         je 0x4697a5
0046955a: 33c9                 xor ecx, ecx
0046955c: 33db                 xor ebx, ebx
0046955e: 8ac8                 mov cl, al
00469560: 381d6dd18900         cmp byte ptr [0x89d16d], bl
00469566: 8d8424c0020000       lea eax, [esp + 0x2c0]
0046956d: 894c246c             mov dword ptr [esp + 0x6c], ecx
00469571: 8918                 mov dword ptr [eax], ebx
00469573: 66895804             mov word ptr [eax + 4], bx
00469577: 7412                 je 0x46958b
00469579: f6c140               test cl, 0x40
0046957c: 740d                 je 0x46958b
0046957e: c68424c002000006     mov byte ptr [esp + 0x2c0], 6
00469586: bb01000000           mov ebx, 1
0046958b: 803d6cd1890000       cmp byte ptr [0x89d16c], 0
00469592: 7410                 je 0x4695a4
00469594: f644246c20           test byte ptr [esp + 0x6c], 0x20
00469599: 7409                 je 0x4695a4
0046959b: c6841cc002000005     mov byte ptr [esp + ebx + 0x2c0], 5
004695a3: 43                   inc ebx
004695a4: 803d6bd1890000       cmp byte ptr [0x89d16b], 0
004695ab: 7410                 je 0x4695bd
004695ad: f644246c10           test byte ptr [esp + 0x6c], 0x10
004695b2: 7409                 je 0x4695bd
004695b4: c6841cc002000004     mov byte ptr [esp + ebx + 0x2c0], 4
004695bc: 43                   inc ebx
004695bd: 803d6ad1890000       cmp byte ptr [0x89d16a], 0
004695c4: 7410                 je 0x4695d6
004695c6: f644246c08           test byte ptr [esp + 0x6c], 8
004695cb: 7409                 je 0x4695d6
004695cd: c6841cc002000003     mov byte ptr [esp + ebx + 0x2c0], 3
004695d5: 43                   inc ebx
004695d6: 803d69d1890000       cmp byte ptr [0x89d169], 0
004695dd: 7410                 je 0x4695ef
004695df: f644246c04           test byte ptr [esp + 0x6c], 4
004695e4: 7409                 je 0x4695ef
004695e6: c6841cc002000002     mov byte ptr [esp + ebx + 0x2c0], 2
004695ee: 43                   inc ebx
004695ef: 803d68d1890000       cmp byte ptr [0x89d168], 0
004695f6: 7410                 je 0x469608
004695f8: f644246c02           test byte ptr [esp + 0x6c], 2
004695fd: 7409                 je 0x469608
004695ff: c6841cc002000001     mov byte ptr [esp + ebx + 0x2c0], 1
00469607: 43                   inc ebx
00469608: 85db                 test ebx, ebx
