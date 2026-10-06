004df0e0 mov ecx, dword ptr [esp + 4]
004df0e4 push ebx
004df0e5 mov al, byte ptr [ecx + 0x2c]
004df0e8 cmp al, 0xa
004df0ea je 0x4df0f0
004df0ec cmp al, 0x21
004df0ee jne 0x4df13b
004df0f0 xor edx, edx
004df0f2 xor eax, eax
004df0f4 mov ax, word ptr [ecx + 0x9b]
004df0fb cmp eax, edx
004df0fd jne 0x4df115
004df0ff xor ebx, ebx
004df101 xor eax, eax
004df103 mov bl, byte ptr [ecx + 0xa6]
004df109 mov ax, word ptr [ecx + ebx*2 + 0x8b]
004df111 test eax, eax
004df113 je 0x4df11f
004df115 lea eax, [eax + eax*4]
004df118 lea edx, [eax*2 + 0x938830]
004df11f test edx, edx
004df121 je 0x4df13b
004df123 test byte ptr [edx + 1], 1
004df127 jne 0x4df13b
004df129 mov al, byte ptr [edx]
004df12b cmp al, 0x11
004df12d je 0x4df137
004df12f cmp al, 0x1f
004df131 je 0x4df137
004df133 cmp al, 0x20
004df135 jne 0x4df13b
004df137 mov al, 1
004df139 pop ebx
004df13a ret 
004df13b xor al, al
004df13d pop ebx
004df13e ret 
