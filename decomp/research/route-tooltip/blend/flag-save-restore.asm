
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0046b0f5 <.text+0x6a0f5>:
  46b0f5:	8b 35 74 a0 5d 00    	mov    esi,DWORD PTR ds:0x5da074
  46b0fb:	8b 3d 7c a0 5d 00    	mov    edi,DWORD PTR ds:0x5da07c
  46b101:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  46b105:	6a 42                	push   0x42
  46b107:	c7 05 74 a0 5d 00 08 	mov    DWORD PTR ds:0x5da074,0x8
  46b10e:	00 00 00 
  46b111:	8b ca                	mov    ecx,edx
  46b113:	8d 6a 08             	lea    ebp,[edx+0x8]
  46b116:	8d 5a 06             	lea    ebx,[edx+0x6]
  46b119:	b8 00 00 00 00       	mov    eax,0x0
  46b11e:	c7 05 7c a0 5d 00 c8 	mov    DWORD PTR ds:0x5da07c,0xc8
  46b125:	00 00 00 
  46b128:	83 3d 2c 3d 5d 00 01 	cmp    DWORD PTR ds:0x5d3d2c,0x1
  46b12f:	0f bf 52 0c          	movsx  edx,WORD PTR [edx+0xc]
  46b133:	83 d0 ff             	adc    eax,0xffffffff
  46b136:	25 f0 2f 99 00       	and    eax,0x992ff0
  46b13b:	50                   	push   eax
  46b13c:	6a 03                	push   0x3
  46b13e:	0f bf 49 0a          	movsx  ecx,WORD PTR [ecx+0xa]
  46b142:	68 ff ff ff c8       	push   0xc8ffffff
  46b147:	52                   	push   edx
  46b148:	0f bf 45 00          	movsx  eax,WORD PTR [ebp+0x0]
  46b14c:	0f bf 13             	movsx  edx,WORD PTR [ebx]
  46b14f:	51                   	push   ecx
  46b150:	50                   	push   eax
  46b151:	52                   	push   edx
  46b152:	e8 a9 b3 0a 00       	call   0x516500
  46b157:	66 8b 4d 00          	mov    cx,WORD PTR [ebp+0x0]
  46b15b:	83 c4 20             	add    esp,0x20
  46b15e:	66 8b 13             	mov    dx,WORD PTR [ebx]
  46b161:	6a 64                	push   0x64
  46b163:	68 80 00 00 00       	push   0x80
  46b168:	51                   	push   ecx
  46b169:	52                   	push   edx
  46b16a:	e8 e1 a1 00 00       	call   0x475350
  46b16f:	83 c4 10             	add    esp,0x10
  46b172:	89 35 74 a0 5d 00    	mov    DWORD PTR ds:0x5da074,esi
  46b178:	89 3d 7c a0 5d 00    	mov    DWORD PTR ds:0x5da07c,edi
  46b17e:	e9 09 10 00 00       	jmp    0x46c18c
