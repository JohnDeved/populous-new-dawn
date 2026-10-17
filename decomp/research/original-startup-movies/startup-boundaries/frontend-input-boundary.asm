
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00459000 <.text+0x58000>:
  459000:	56                   	push   esi
  459001:	8b 35 84 c7 d0 00    	mov    esi,DWORD PTR ds:0xd0c784
  459007:	ff d6                	call   esi
  459009:	f6 05 00 9d 74 00 01 	test   BYTE PTR ds:0x749d00,0x1
  459010:	a3 00 9e 74 00       	mov    ds:0x749e00,eax
  459015:	75 12                	jne    0x459029
  459017:	80 0d 00 9d 74 00 01 	or     BYTE PTR ds:0x749d00,0x1
  45901e:	ff 15 58 c8 d0 00    	call   DWORD PTR ds:0xd0c858
  459024:	a3 8c 9c 74 00       	mov    ds:0x749c8c,eax
  459029:	ff d6                	call   esi
  45902b:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  45902f:	81 f9 f0 00 00 00    	cmp    ecx,0xf0
  459035:	74 41                	je     0x459078
  459037:	81 f9 f1 00 00 00    	cmp    ecx,0xf1
  45903d:	74 7d                	je     0x4590bc
  45903f:	81 f9 f2 00 00 00    	cmp    ecx,0xf2
  459045:	0f 84 8e 00 00 00    	je     0x4590d9
  45904b:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  45904f:	83 3d d8 9c 74 00 14 	cmp    DWORD PTR ds:0x749cd8,0x14
  459056:	75 19                	jne    0x459071
  459058:	85 c9                	test   ecx,ecx
  45905a:	74 15                	je     0x459071
  45905c:	a1 ec 9c 74 00       	mov    eax,ds:0x749cec
  459061:	8d 0c 40             	lea    ecx,[eax+eax*2]
  459064:	8b 04 cd 3c a0 5d 00 	mov    eax,DWORD PTR [ecx*8+0x5da03c]
  45906b:	85 c0                	test   eax,eax
  45906d:	74 02                	je     0x459071
  45906f:	ff d0                	call   eax
  459071:	b8 01 00 00 00       	mov    eax,0x1
  459076:	5e                   	pop    esi
  459077:	c3                   	ret
  459078:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  45907c:	85 c9                	test   ecx,ecx
  45907e:	74 33                	je     0x4590b3
  459080:	83 0d fc 9d 74 00 01 	or     DWORD PTR ds:0x749dfc,0x1
  459087:	8b d0                	mov    edx,eax
  459089:	2b 15 60 d1 59 00    	sub    edx,DWORD PTR ds:0x59d160
  45908f:	3b 15 8c 9c 74 00    	cmp    edx,DWORD PTR ds:0x749c8c
  459095:	73 0e                	jae    0x4590a5
  459097:	83 0d fc 9d 74 00 02 	or     DWORD PTR ds:0x749dfc,0x2
  45909e:	a3 60 d1 59 00       	mov    ds:0x59d160,eax
  4590a3:	eb aa                	jmp    0x45904f
  4590a5:	83 25 fc 9d 74 00 fd 	and    DWORD PTR ds:0x749dfc,0xfffffffd
  4590ac:	a3 60 d1 59 00       	mov    ds:0x59d160,eax
  4590b1:	eb 9c                	jmp    0x45904f
  4590b3:	83 25 fc 9d 74 00 fe 	and    DWORD PTR ds:0x749dfc,0xfffffffe
  4590ba:	eb 93                	jmp    0x45904f
  4590bc:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  4590c0:	85 c9                	test   ecx,ecx
  4590c2:	74 09                	je     0x4590cd
  4590c4:	83 0d fc 9d 74 00 04 	or     DWORD PTR ds:0x749dfc,0x4
  4590cb:	eb 82                	jmp    0x45904f
  4590cd:	83 25 fc 9d 74 00 fb 	and    DWORD PTR ds:0x749dfc,0xfffffffb
  4590d4:	e9 76 ff ff ff       	jmp    0x45904f
  4590d9:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  4590dd:	85 c9                	test   ecx,ecx
  4590df:	74 0c                	je     0x4590ed
  4590e1:	83 0d fc 9d 74 00 08 	or     DWORD PTR ds:0x749dfc,0x8
  4590e8:	e9 62 ff ff ff       	jmp    0x45904f
  4590ed:	83 25 fc 9d 74 00 f7 	and    DWORD PTR ds:0x749dfc,0xfffffff7
  4590f4:	e9 56 ff ff ff       	jmp    0x45904f

INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0045a500 <.text+0x59500>:
  45a500:	83 ec 18             	sub    esp,0x18
  45a503:	83 3d d8 9c 74 00 14 	cmp    DWORD PTR ds:0x749cd8,0x14
  45a50a:	c7 44 24 00 00 00 00 	mov    DWORD PTR [esp+0x0],0x0
  45a511:	00 
  45a512:	53                   	push   ebx
  45a513:	56                   	push   esi
  45a514:	57                   	push   edi
  45a515:	55                   	push   ebp
  45a516:	75 2c                	jne    0x45a544
  45a518:	83 7c 24 30 00       	cmp    DWORD PTR [esp+0x30],0x0
  45a51d:	0f 84 07 07 00 00    	je     0x45ac2a
  45a523:	a1 ec 9c 74 00       	mov    eax,ds:0x749cec
  45a528:	8d 0c 40             	lea    ecx,[eax+eax*2]
  45a52b:	8b 04 cd 3c a0 5d 00 	mov    eax,DWORD PTR [ecx*8+0x5da03c]
  45a532:	85 c0                	test   eax,eax
  45a534:	0f 84 f0 06 00 00    	je     0x45ac2a
  45a53a:	ff d0                	call   eax
  45a53c:	5d                   	pop    ebp
  45a53d:	5f                   	pop    edi
  45a53e:	5e                   	pop    esi
  45a53f:	5b                   	pop    ebx
  45a540:	83 c4 18             	add    esp,0x18
  45a543:	c3                   	ret
