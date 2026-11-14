004450cb: 83fb3e               cmp ebx, 0x3e
004450ce: 7508                 jne 0x4450d8
004450d0: c744241c01000000     mov dword ptr [esp + 0x1c], 1
004450d8: 8b442434             mov eax, dword ptr [esp + 0x34]
004450dc: 50                   push eax
004450dd: e82e0bffff           call 0x435c10
004450e2: 83c404               add esp, 4
