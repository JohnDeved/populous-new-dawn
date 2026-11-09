
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00529e80 <.text+0x128e80>:
  529e80:	56                   	push   esi
  529e81:	57                   	push   edi
  529e82:	83 39 00             	cmp    DWORD PTR [ecx],0x0
  529e85:	8b f1                	mov    esi,ecx
  529e87:	74 05                	je     0x529e8e
  529e89:	e8 32 01 00 00       	call   0x529fc0
  529e8e:	83 7c 24 10 00       	cmp    DWORD PTR [esp+0x10],0x0
  529e93:	6a 00                	push   0x0
  529e95:	74 07                	je     0x529e9e
  529e97:	68 01 00 00 80       	push   0x80000001
  529e9c:	eb 05                	jmp    0x529ea3
  529e9e:	68 02 00 00 80       	push   0x80000002
  529ea3:	68 48 09 5e 00       	push   0x5e0948
  529ea8:	e8 83 01 00 00       	call   0x52a030
  529ead:	83 c4 0c             	add    esp,0xc
  529eb0:	8b f8                	mov    edi,eax
  529eb2:	85 ff                	test   edi,edi
  529eb4:	75 0a                	jne    0x529ec0
  529eb6:	b8 ff ff ff ff       	mov    eax,0xffffffff
  529ebb:	5f                   	pop    edi
  529ebc:	5e                   	pop    esi
  529ebd:	c2 08 00             	ret    0x8
  529ec0:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  529ec4:	85 c0                	test   eax,eax
  529ec6:	74 1f                	je     0x529ee7
  529ec8:	6a 00                	push   0x0
  529eca:	57                   	push   edi
  529ecb:	50                   	push   eax
  529ecc:	e8 5f 01 00 00       	call   0x52a030
  529ed1:	83 c4 0c             	add    esp,0xc
  529ed4:	89 06                	mov    DWORD PTR [esi],eax
  529ed6:	57                   	push   edi
  529ed7:	ff 15 88 c5 d0 00    	call   DWORD PTR ds:0xd0c588
  529edd:	5f                   	pop    edi
  529ede:	83 3e 01             	cmp    DWORD PTR [esi],0x1
  529ee1:	1b c0                	sbb    eax,eax
  529ee3:	5e                   	pop    esi
  529ee4:	c2 08 00             	ret    0x8
  529ee7:	89 3e                	mov    DWORD PTR [esi],edi
  529ee9:	5f                   	pop    edi
  529eea:	83 3e 01             	cmp    DWORD PTR [esi],0x1
  529eed:	5e                   	pop    esi
  529eee:	1b c0                	sbb    eax,eax
  529ef0:	c2 08 00             	ret    0x8

INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0052a030 <.text+0x129030>:
  52a030:	83 ec 04             	sub    esp,0x4
  52a033:	33 c9                	xor    ecx,ecx
  52a035:	39 4c 24 10          	cmp    DWORD PTR [esp+0x10],ecx
  52a039:	74 05                	je     0x52a040
  52a03b:	b9 01 00 00 00       	mov    ecx,0x1
  52a040:	8d 44 24 00          	lea    eax,[esp+0x0]
  52a044:	6a 00                	push   0x0
  52a046:	50                   	push   eax
  52a047:	6a 00                	push   0x0
  52a049:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  52a04d:	68 3f 00 0f 00       	push   0xf003f
  52a052:	51                   	push   ecx
  52a053:	6a 00                	push   0x0
  52a055:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  52a059:	6a 00                	push   0x0
  52a05b:	51                   	push   ecx
  52a05c:	52                   	push   edx
  52a05d:	ff 15 94 c5 d0 00    	call   DWORD PTR ds:0xd0c594
  52a063:	85 c0                	test   eax,eax
  52a065:	75 08                	jne    0x52a06f
  52a067:	8b 44 24 00          	mov    eax,DWORD PTR [esp+0x0]
  52a06b:	83 c4 04             	add    esp,0x4
  52a06e:	c3                   	ret
  52a06f:	33 c0                	xor    eax,eax
  52a071:	83 c4 04             	add    esp,0x4
  52a074:	c3                   	ret
