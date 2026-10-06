004cc112 lea edi, [esp + 0x80]
004cc119 xor eax, eax
004cc11b mov ecx, 0xa
004cc120 rep stosd dword ptr es:[edi], eax
004cc122 lea edi, [esp + 0xa8]
004cc129 mov ecx, 0xa
004cc12e rep stosd dword ptr es:[edi], eax
004cc130 mov dx, word ptr [ebx + 0x10]
004cc134 push 7
004cc136 lea eax, [esp + 0xac]
004cc13d push 0xa
004cc13f lea ecx, [esp + 0x88]
004cc146 push eax
004cc147 push ecx
004cc148 push edx
004cc149 push ebp
004cc14a call 0x4f5950
004cc14f mov esi, dword ptr [esp + 0xf0]
004cc156 mov eax, dword ptr [esp + 0x4c]
004cc15a lea ecx, [esp + 0xc0]
004cc161 lea edx, [esp + 0x98]
004cc168 add esp, 0x18
004cc16b inc esi
004cc16c push eax
004cc16d push ecx
004cc16e push edx
004cc16f push esi
004cc170 push ebx
004cc171 push ebp
004cc172 call 0x4ce2c0
004cc177 add esp, 0x18
004cc17a mov ecx, eax
004cc17c test ecx, ecx
004cc17e jne 0x4cc1a3
004cc180 push 0x33
004cc182 xor eax, eax
004cc184 mov ax, word ptr [ebx + 0x18]
004cc188 push eax
004cc189 push ebp
004cc18a call 0x48c650
004cc18f add esp, 0xc
004cc192 mov word ptr [ebx + 0x42], 0x17
004cc198 pop ebp
004cc199 pop edi
004cc19a pop esi
004cc19b pop ebx
004cc19c add esp, 0xc0
004cc1a2 ret 
004cc1a3 cmp dword ptr [esp + 0x80], 0
004cc1ab jne 0x4cc239
004cc1b1 cmp dword ptr [esp + 0xa8], 0
004cc1b9 jne 0x4cc239
004cc1bb mov ax, word ptr [ebx + 0x1a]
004cc1bf mov word ptr [esp + 0x14], ax
004cc1c4 mov eax, dword ptr [0x89d178]
004cc1c9 mov edx, eax
004cc1cb lea edi, [eax + eax*8]
004cc1ce lea eax, [edx + edi*8]
004cc1d1 lea eax, [edx + eax*4]
004cc1d4 shl eax, 2
004cc1d7 lea eax, [edx + eax*8]
004cc1da add eax, 0x24df
004cc1df mov dword ptr [0x89d178], eax
004cc1e4 mov dword ptr [esp + 0x60], eax
004cc1e8 ror dword ptr [esp + 0x60], 0xd
004cc1ed mov eax, dword ptr [esp + 0x60]
004cc1f1 and al, 0x3f
004cc1f3 sub al, 0x20
004cc1f5 add byte ptr [esp + 0x14], al
004cc1f9 mov eax, dword ptr [esp + 0x60]
004cc1fd mov edx, eax
004cc1ff lea edi, [eax + eax*8]
004cc202 lea eax, [edx + edi*8]
004cc205 lea eax, [edx + eax*4]
004cc208 shl eax, 2
004cc20b lea eax, [edx + eax*8]
004cc20e add eax, 0x24df
004cc213 mov dword ptr [esp + 0x5c], eax
004cc217 ror dword ptr [esp + 0x5c], 0xd
004cc21c mov eax, dword ptr [esp + 0x5c]
004cc220 mov dword ptr [0x89d178], eax
004cc225 and al, 0x3f
004cc227 sub al, 0x20
004cc229 add byte ptr [esp + 0x15], al
004cc22d mov dx, word ptr [esp + 0x14]
004cc232 mov word ptr [ebx + 0x10], dx
004cc236 inc byte ptr [ebx + 0x2e]
004cc239 mov eax, dword ptr [ebx]
004cc23b cmp dword ptr [ebx + 0x3a], eax
004cc23e jle 0x4cc272
004cc240 cmp byte ptr [ebx + 0x2e], 0x20
004cc244 ja 0x4cc272
004cc246 xor eax, eax
004cc248 mov edi, 0x64
004cc24d mov al, byte ptr [ebx + 0x2b]
004cc250 imul eax, dword ptr [ebx + 0x36]
004cc254 cdq 
004cc255 idiv edi
004cc257 cmp eax, ecx
004cc259 jg 0x4cc272
004cc25b cmp byte ptr [ebx + 0x2c], 0
004cc25f jbe 0x4cb587
004cc265 test byte ptr [ebp + 0x596], 4
004cc26c je 0x4cb587
004cc272 push ebp
004cc273 call 0x4f6020
004cc278 mov word ptr [esp + 0x20], ax
004cc27d add esp, 4
004cc280 mov eax, 0xfe
004cc285 and byte ptr [esp + 0x1c], al
004cc289 and byte ptr [esp + 0x1d], al
004cc28d movzx ax, byte ptr [esp + 0x1c]
004cc293 shl ax, 8
004cc297 mov edi, dword ptr [ebp + 0x881]
004cc29d mov word ptr [esp + 0x38], ax
004cc2a2 movzx ax, byte ptr [esp + 0x1d]
004cc2a8 shl ax, 8
004cc2ac test edi, edi
004cc2ae mov word ptr [esp + 0x3a], ax
004cc2b3 je 0x4cc2d8
004cc2b5 push esi
004cc2b6 push edi
004cc2b7 call 0x4f2460
004cc2bc add esp, 8
004cc2bf test eax, eax
004cc2c1 je 0x4cc2d1
004cc2c3 lea eax, [esp + 0x38]
004cc2c7 push eax
004cc2c8 push edi
004cc2c9 call 0x43b2a0
004cc2ce add esp, 8
004cc2d1 mov edi, dword ptr [edi + 8]
004cc2d4 test edi, edi
004cc2d6 jne 0x4cc2b5
004cc2d8 push 0x34
004cc2da xor eax, eax
004cc2dc mov dword ptr [ebx + 4], 0
004cc2e3 mov word ptr [ebx + 0x42], 6
004cc2e9 mov ax, word ptr [ebx + 0x18]
004cc2ed push eax
004cc2ee push ebp
004cc2ef call 0x48c650
004cc2f4 add esp, 0xc
004cc2f7 mov word ptr [ebx + 0x44], 0x17
004cc2fd pop ebp
004cc2fe pop edi
004cc2ff pop esi
004cc300 pop ebx
004cc301 add esp, 0xc0
004cc307 ret 
