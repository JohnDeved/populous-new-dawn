004ce43d inc dword ptr [esp + 0x34]
004ce441 test byte ptr [ebx + 0x10], 0x40
004ce445 jne 0x4ce47b
004ce447 mov ax, word ptr [edi + 0x10]
004ce44b lea ecx, [esp + 0x3c]
004ce44f mov word ptr [esp + 0x2e], ax
004ce454 push ecx
004ce455 lea eax, [esp + 0x32]
004ce459 push eax
004ce45a push ebp
004ce45b call 0x4f5770
004ce460 add esp, 0xc
004ce463 test eax, eax
004ce465 je 0x4ce475
004ce467 mov eax, dword ptr [esp + 0x2e]
004ce46b push eax
004ce46c push ebx
004ce46d call 0x43b790
004ce472 add esp, 8
004ce475 or dword ptr [ebx + 0x10], 0x40
004ce479 jmp 0x4ce4c9
004ce47b push ebx
004ce47c call 0x4df0e0
004ce481 add esp, 4
004ce484 test al, al
004ce486 jne 0x4ce4c9
004ce488 xor eax, eax
004ce48a mov al, byte ptr [ebx + 0x2c]
004ce48d test byte ptr [eax + eax*4 + 0x5a6f79], 8
004ce495 je 0x4ce4c9
004ce497 and dword ptr [ebx + 0x14], 0xfffffffd
004ce49b mov ax, word ptr [edi + 0x10]
004ce49f lea ecx, [esp + 0x3c]
004ce4a3 mov word ptr [esp + 0x2e], ax
004ce4a8 push ecx
004ce4a9 lea eax, [esp + 0x32]
004ce4ad push eax
004ce4ae push ebp
004ce4af call 0x4f5770
004ce4b4 add esp, 0xc
004ce4b7 test eax, eax
004ce4b9 je 0x4ce4c9
004ce4bb mov eax, dword ptr [esp + 0x2e]
004ce4bf push eax
004ce4c0 push ebx
004ce4c1 call 0x43b790
004ce4c6 add esp, 8
