
game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057e090 <.text+0x17d090>:
  57e090:	10 8b 44 24 0c c1    	adc    BYTE PTR [ebx-0x3ef3dbbc],cl
  57e096:	e8 05 83 e0 01       	call   0x23863a0
  57e09b:	89 86 c8 03 00 00    	mov    DWORD PTR [esi+0x3c8],eax
  57e0a1:	8b 06                	mov    eax,DWORD PTR [esi]
  57e0a3:	f7 40 04 00 00 40 00 	test   DWORD PTR [eax+0x4],0x400000
  57e0aa:	74 1c                	je     0x57e0c8
  57e0ac:	8b 40 58             	mov    eax,DWORD PTR [eax+0x58]
  57e0af:	85 c0                	test   eax,eax
  57e0b1:	74 15                	je     0x57e0c8
  57e0b3:	8b c8                	mov    ecx,eax
  57e0b5:	e8 76 00 00 00       	call   0x57e130
  57e0ba:	89 86 cc 03 00 00    	mov    DWORD PTR [esi+0x3cc],eax
  57e0c0:	33 c0                	xor    eax,eax
  57e0c2:	5f                   	pop    edi
  57e0c3:	5e                   	pop    esi
  57e0c4:	83 c4 60             	add    esp,0x60
  57e0c7:	c3                   	ret
  57e0c8:	c7 86 cc 03 00 00 00 	mov    DWORD PTR [esi+0x3cc],0x8000
  57e0cf:	80 00 00 
  57e0d2:	33 c0                	xor    eax,eax
  57e0d4:	5f                   	pop    edi
  57e0d5:	5e                   	pop    esi
  57e0d6:	83 c4 60             	add    esp,0x60
  57e0d9:	c3                   	ret
  57e0da:	c7 42 58 00 00 00 00 	mov    DWORD PTR [edx+0x58],0x0
  57e0e1:	5f                   	pop    edi
  57e0e2:	33 c0                	xor    eax,eax
  57e0e4:	5e                   	pop    esi
  57e0e5:	83 c4 60             	add    esp,0x60
  57e0e8:	c3                   	ret
  57e0e9:	90                   	nop
  57e0ea:	90                   	nop
  57e0eb:	90                   	nop
  57e0ec:	90                   	nop
  57e0ed:	90                   	nop
  57e0ee:	90                   	nop
  57e0ef:	90                   	nop
  57e0f0:	56                   	push   esi
  57e0f1:	57                   	push   edi
  57e0f2:	8b f1                	mov    esi,ecx
  57e0f4:	6a 00                	push   0x0
  57e0f6:	56                   	push   esi
  57e0f7:	8b fa                	mov    edi,edx
  57e0f9:	6a 00                	push   0x0
  57e0fb:	e8 dc 5d 00 00       	call   0x583edc
  57e100:	85 c0                	test   eax,eax
  57e102:	75 1a                	jne    0x57e11e
  57e104:	8b 06                	mov    eax,DWORD PTR [esi]
  57e106:	6a 02                	push   0x2
  57e108:	57                   	push   edi
  57e109:	50                   	push   eax
  57e10a:	8b 08                	mov    ecx,DWORD PTR [eax]
  57e10c:	ff 51 18             	call   DWORD PTR [ecx+0x18]
  57e10f:	85 c0                	test   eax,eax
  57e111:	75 03                	jne    0x57e116
  57e113:	5f                   	pop    edi
  57e114:	5e                   	pop    esi
  57e115:	c3                   	ret
  57e116:	8b 06                	mov    eax,DWORD PTR [esi]
  57e118:	50                   	push   eax
  57e119:	8b 10                	mov    edx,DWORD PTR [eax]
  57e11b:	ff 52 08             	call   DWORD PTR [edx+0x8]
  57e11e:	c7 06 00 00 00 00    	mov    DWORD PTR [esi],0x0
  57e124:	5f                   	pop    edi
  57e125:	b8 01 00 00 00       	mov    eax,0x1
  57e12a:	5e                   	pop    esi
  57e12b:	c3                   	ret
  57e12c:	90                   	nop
  57e12d:	90                   	nop
  57e12e:	90                   	nop
  57e12f:	90                   	nop
  57e130:	83 ec 14             	sub    esp,0x14
  57e133:	33 c0                	xor    eax,eax
  57e135:	8b 11                	mov    edx,DWORD PTR [ecx]
  57e137:	89 44 24 00          	mov    DWORD PTR [esp+0x0],eax
  57e13b:	c7 44 24 00 14 00 00 	mov    DWORD PTR [esp+0x0],0x14
  57e142:	00 
  57e143:	89 44 24 04          	mov    DWORD PTR [esp+0x4],eax
  57e147:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  57e14b:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  57e14f:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  57e153:	8d 44 24 00          	lea    eax,[esp+0x0]
  57e157:	50                   	push   eax
  57e158:	51                   	push   ecx
  57e159:	ff 52 0c             	call   DWORD PTR [edx+0xc]
  57e15c:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  57e160:	83 c4 14             	add    esp,0x14
  57e163:	c3                   	ret
  57e164:	90                   	nop
  57e165:	90                   	nop
  57e166:	90                   	nop
  57e167:	90                   	nop
  57e168:	90                   	nop
  57e169:	90                   	nop
  57e16a:	90                   	nop
  57e16b:	90                   	nop
  57e16c:	90                   	nop
  57e16d:	90                   	nop
  57e16e:	90                   	nop
  57e16f:	90                   	nop
  57e170:	56                   	push   esi
  57e171:	8b f1                	mov    esi,ecx
  57e173:	8b 06                	mov    eax,DWORD PTR [esi]
  57e175:	f7 40 04 00 00 80 00 	test   DWORD PTR [eax+0x4],0x800000
  57e17c:	74 34                	je     0x57e1b2
  57e17e:	8b                   	.byte 0x8b
  57e17f:	8e                   	.byte 0x8e
