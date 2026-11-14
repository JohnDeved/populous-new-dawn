00435c10: 8b442404             mov eax, dword ptr [esp + 4]
00435c14: 8b8081080000         mov eax, dword ptr [eax + 0x881]
00435c1a: 85c0                 test eax, eax
00435c1c: 741a                 je 0x435c38
00435c1e: 8a487a               mov cl, byte ptr [eax + 0x7a]
00435c21: f6c180               test cl, 0x80
00435c24: 7405                 je 0x435c2b
00435c26: 80c901               or cl, 1
00435c29: eb03                 jmp 0x435c2e
00435c2b: 80e1fe               and cl, 0xfe
00435c2e: 88487a               mov byte ptr [eax + 0x7a], cl
00435c31: 8b4008               mov eax, dword ptr [eax + 8]
00435c34: 85c0                 test eax, eax
00435c36: 75e6                 jne 0x435c1e
00435c38: c3                   ret 
