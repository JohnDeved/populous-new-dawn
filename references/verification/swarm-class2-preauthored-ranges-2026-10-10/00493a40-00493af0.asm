
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00493a40 <.text+0x92a40>:
  493a40:	53                   	push   ebx
  493a41:	33 c0                	xor    eax,eax
  493a43:	57                   	push   edi
  493a44:	b9 dc 6b 00 00       	mov    ecx,0x6bdc
  493a49:	bf 70 a7 93 00       	mov    edi,0x93a770
  493a4e:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  493a50:	b8 01 00 00 00       	mov    eax,0x1
  493a55:	b9 03 00 00 00       	mov    ecx,0x3
  493a5a:	a3 7c a7 93 00       	mov    ds:0x93a77c,eax
  493a5f:	89 0d 80 a7 93 00    	mov    DWORD PTR ds:0x93a780,ecx
  493a65:	c7 05 84 a7 93 00 02 	mov    DWORD PTR ds:0x93a784,0x2
  493a6c:	00 00 00 
  493a6f:	81 3d 78 a7 93 00 e8 	cmp    DWORD PTR ds:0x93a778,0x3e8
  493a76:	03 00 00 
  493a79:	a3 88 a7 93 00       	mov    ds:0x93a788,eax
  493a7e:	7c 0d                	jl     0x493a8d
  493a80:	a3 80 a7 93 00       	mov    ds:0x93a780,eax
  493a85:	89 0d 88 a7 93 00    	mov    DWORD PTR ds:0x93a788,ecx
  493a8b:	eb 3d                	jmp    0x493aca
  493a8d:	81 3d 78 a7 93 00 f4 	cmp    DWORD PTR ds:0x93a778,0x1f4
  493a94:	01 00 00 
  493a97:	7c 16                	jl     0x493aaf
  493a99:	c7 05 80 a7 93 00 01 	mov    DWORD PTR ds:0x93a780,0x1
  493aa0:	00 00 00 
  493aa3:	c7 05 88 a7 93 00 02 	mov    DWORD PTR ds:0x93a788,0x2
  493aaa:	00 00 00 
  493aad:	eb 1b                	jmp    0x493aca
  493aaf:	81 3d 78 a7 93 00 2c 	cmp    DWORD PTR ds:0x93a778,0x12c
  493ab6:	01 00 00 
  493ab9:	7c 0f                	jl     0x493aca
  493abb:	b8 01 00 00 00       	mov    eax,0x1
  493ac0:	a3 80 a7 93 00       	mov    ds:0x93a780,eax
  493ac5:	a3 88 a7 93 00       	mov    ds:0x93a788,eax
  493aca:	ba a0 a7 93 00       	mov    edx,0x93a7a0
  493acf:	bb 05 00 00 00       	mov    ebx,0x5
  493ad4:	8b fa                	mov    edi,edx
  493ad6:	33 c0                	xor    eax,eax
  493ad8:	b9 06 00 00 00       	mov    ecx,0x6
  493add:	83 c2 18             	add    edx,0x18
  493ae0:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  493ae2:	88 5a e9             	mov    BYTE PTR [edx-0x17],bl
  493ae5:	81 fa e0 b2 93 00    	cmp    edx,0x93b2e0
  493aeb:	72 e7                	jb     0x493ad4
  493aed:	5f                   	pop    edi
  493aee:	5b                   	pop    ebx
  493aef:	c3                   	ret
