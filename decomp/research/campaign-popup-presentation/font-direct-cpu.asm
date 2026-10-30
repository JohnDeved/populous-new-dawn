
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

005279d0 <.text+0x1269d0>:
  5279d0:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  5279d4:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  5279d8:	8d 14 c8             	lea    edx,[eax+ecx*8]
  5279db:	33 c0                	xor    eax,eax
  5279dd:	66 8b 82 04 ff ff ff 	mov    ax,WORD PTR [edx-0xfc]
  5279e4:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  5279e8:	89 01                	mov    DWORD PTR [ecx],eax
  5279ea:	33 c0                	xor    eax,eax
  5279ec:	66 8b 82 06 ff ff ff 	mov    ax,WORD PTR [edx-0xfa]
  5279f3:	89 41 04             	mov    DWORD PTR [ecx+0x4],eax
  5279f6:	c3                   	ret
  5279f7:	cc                   	int3
  5279f8:	cc                   	int3
  5279f9:	cc                   	int3
  5279fa:	cc                   	int3
  5279fb:	cc                   	int3
  5279fc:	cc                   	int3
  5279fd:	cc                   	int3
  5279fe:	cc                   	int3
  5279ff:	cc                   	int3
  527a00:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  527a04:	56                   	push   esi
  527a05:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  527a09:	8d b4 c8 00 ff ff ff 	lea    esi,[eax+ecx*8-0x100]
  527a10:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  527a14:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  527a18:	56                   	push   esi
  527a19:	51                   	push   ecx
  527a1a:	50                   	push   eax
  527a1b:	e8 c0 2d 00 00       	call   0x52a7e0
  527a20:	83 c4 0c             	add    esp,0xc
  527a23:	33 c0                	xor    eax,eax
  527a25:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  527a29:	5e                   	pop    esi
  527a2a:	c3                   	ret
  527a2b:	cc                   	int3
  527a2c:	cc                   	int3
  527a2d:	cc                   	int3
  527a2e:	cc                   	int3
  527a2f:	cc                   	int3
  527a30:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  527a34:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  527a38:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  527a3c:	8d 0c c8             	lea    ecx,[eax+ecx*8]
  527a3f:	33 c0                	xor    eax,eax
  527a41:	66 8b 81 04 ff ff ff 	mov    ax,WORD PTR [ecx-0xfc]
  527a48:	89 02                	mov    DWORD PTR [edx],eax
  527a4a:	33 c0                	xor    eax,eax
  527a4c:	66 8b 81 06 ff ff ff 	mov    ax,WORD PTR [ecx-0xfa]
  527a53:	89 42 04             	mov    DWORD PTR [edx+0x4],eax
  527a56:	c3                   	ret
  527a57:	cc                   	int3
  527a58:	cc                   	int3
  527a59:	cc                   	int3
  527a5a:	cc                   	int3
  527a5b:	cc                   	int3
  527a5c:	cc                   	int3
  527a5d:	cc                   	int3
  527a5e:	cc                   	int3
  527a5f:	cc                   	int3
  527a60:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  527a64:	56                   	push   esi
  527a65:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  527a69:	8b 54 24 10          	mov    edx,DWORD PTR [esp+0x10]
  527a6d:	8d b4 c8 00 ff ff ff 	lea    esi,[eax+ecx*8-0x100]
  527a74:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  527a78:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  527a7c:	51                   	push   ecx
  527a7d:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  527a81:	50                   	push   eax
  527a82:	56                   	push   esi
  527a83:	52                   	push   edx
  527a84:	51                   	push   ecx
  527a85:	e8 76 48 00 00       	call   0x52c300
  527a8a:	83 c4 14             	add    esp,0x14
  527a8d:	33 c0                	xor    eax,eax
  527a8f:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  527a93:	5e                   	pop    esi
  527a94:	c3                   	ret
