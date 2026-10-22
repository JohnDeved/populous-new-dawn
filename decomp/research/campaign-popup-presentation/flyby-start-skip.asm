
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00448ee0 <.text+0x47ee0>:
  448ee0:	f6 05 46 f7 98 00 10 	test   BYTE PTR ds:0x98f746,0x10
  448ee7:	53                   	push   ebx
  448ee8:	0f 85 a9 00 00 00    	jne    0x448f97
  448eee:	6a 01                	push   0x1
  448ef0:	e8 9b 40 05 00       	call   0x49cf90
  448ef5:	c6 05 d2 9b 96 00 00 	mov    BYTE PTR ds:0x969bd2,0x0
  448efc:	c6 05 d4 9b 96 00 06 	mov    BYTE PTR ds:0x969bd4,0x6
  448f03:	80 0d d7 9b 96 00 01 	or     BYTE PTR ds:0x969bd7,0x1
  448f0a:	80 25 d7 9b 96 00 bf 	and    BYTE PTR ds:0x969bd7,0xbf
  448f11:	83 c4 04             	add    esp,0x4
  448f14:	80 25 d7 9b 96 00 7f 	and    BYTE PTR ds:0x969bd7,0x7f
  448f1b:	6a 40                	push   0x40
  448f1d:	e8 7e 61 06 00       	call   0x4af0a0
  448f22:	83 c4 04             	add    esp,0x4
  448f25:	83 25 69 c6 89 00 df 	and    DWORD PTR ds:0x89c669,0xffffffdf
  448f2c:	66 83 3d c1 c6 89 00 	cmp    WORD PTR ds:0x89c6c1,0x2
  448f33:	02 
  448f34:	74 09                	je     0x448f3f
  448f36:	80 3d 36 ce 89 00 00 	cmp    BYTE PTR ds:0x89ce36,0x0
  448f3d:	74 58                	je     0x448f97
  448f3f:	80 3d f7 bb 89 00 01 	cmp    BYTE PTR ds:0x89bbf7,0x1
  448f46:	74 4f                	je     0x448f97
  448f48:	0f be 0d f0 c6 89 00 	movsx  ecx,BYTE PTR ds:0x89c6f0
  448f4f:	33 db                	xor    ebx,ebx
  448f51:	8b c1                	mov    eax,ecx
  448f53:	8d 14 89             	lea    edx,[ecx+ecx*4]
  448f56:	88 1d 36 ce 89 00    	mov    BYTE PTR ds:0x89ce36,bl
  448f5c:	8d 0c 50             	lea    ecx,[eax+edx*2]
  448f5f:	88 1d 35 ce 89 00    	mov    BYTE PTR ds:0x89ce35,bl
  448f65:	89 1d 20 e4 5f 00    	mov    DWORD PTR ds:0x5fe420,ebx
  448f6b:	88 1d 34 ce 89 00    	mov    BYTE PTR ds:0x89ce34,bl
  448f71:	8d 14 c9             	lea    edx,[ecx+ecx*8]
  448f74:	8d 0c d0             	lea    ecx,[eax+edx*8]
  448f77:	0f bf 84 88 fa d1 89 	movsx  eax,WORD PTR [eax+ecx*4+0x89d1fa]
  448f7e:	00 
  448f7f:	50                   	push   eax
  448f80:	e8 3b 3e fd ff       	call   0x41cdc0
  448f85:	83 c4 04             	add    esp,0x4
  448f88:	88 1d eb c6 89 00    	mov    BYTE PTR ds:0x89c6eb,bl
  448f8e:	53                   	push   ebx
  448f8f:	e8 1c 45 fd ff       	call   0x41d4b0
  448f94:	83 c4 04             	add    esp,0x4
  448f97:	5b                   	pop    ebx
  448f98:	c3                   	ret
  448f99:	cc                   	int3
  448f9a:	cc                   	int3
  448f9b:	cc                   	int3
  448f9c:	cc                   	int3
  448f9d:	cc                   	int3
  448f9e:	cc                   	int3
  448f9f:	cc                   	int3
  448fa0:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  448fa7:	74 50                	je     0x448ff9
  448fa9:	80 25 d7 9b 96 00 fe 	and    BYTE PTR ds:0x969bd7,0xfe
  448fb0:	6a 01                	push   0x1
  448fb2:	e8 e9 3f 05 00       	call   0x49cfa0
  448fb7:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  448fbe:	8d 14 80             	lea    edx,[eax+eax*4]
  448fc1:	83 c4 04             	add    esp,0x4
  448fc4:	8b c8                	mov    ecx,eax
  448fc6:	8d 04 51             	lea    eax,[ecx+edx*2]
  448fc9:	8d 14 c0             	lea    edx,[eax+eax*8]
  448fcc:	8d 04 d1             	lea    eax,[ecx+edx*8]
  448fcf:	8d 84 81 fc d1 89 00 	lea    eax,[ecx+eax*4+0x89d1fc]
  448fd6:	66 83 38 00          	cmp    WORD PTR [eax],0x0
  448fda:	74 13                	je     0x448fef
  448fdc:	66 c7 00 00 00       	mov    WORD PTR [eax],0x0
  448fe1:	6a 00                	push   0x0
  448fe3:	6a 00                	push   0x0
  448fe5:	6a 0c                	push   0xc
  448fe7:	e8 14 0f 03 00       	call   0x479f00
  448fec:	83 c4 0c             	add    esp,0xc
  448fef:	6a 40                	push   0x40
  448ff1:	e8 ca 61 06 00       	call   0x4af1c0
  448ff6:	83 c4 04             	add    esp,0x4
  448ff9:	c3                   	ret
  448ffa:	cc                   	int3
  448ffb:	cc                   	int3
  448ffc:	cc                   	int3
  448ffd:	cc                   	int3
  448ffe:	cc                   	int3
  448fff:	cc                   	int3
  449000:	80 25 d7 9b 96 00 fe 	and    BYTE PTR ds:0x969bd7,0xfe
  449007:	6a 01                	push   0x1
  449009:	e8 92 3f 05 00       	call   0x49cfa0
  44900e:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  449015:	8d 14 80             	lea    edx,[eax+eax*4]
  449018:	83 c4 04             	add    esp,0x4
  44901b:	8b c8                	mov    ecx,eax
  44901d:	8d 04 51             	lea    eax,[ecx+edx*2]
  449020:	8d 14 c0             	lea    edx,[eax+eax*8]
  449023:	8d 04 d1             	lea    eax,[ecx+edx*8]
  449026:	8d 84 81 fc d1 89 00 	lea    eax,[ecx+eax*4+0x89d1fc]
  44902d:	66 83 38 00          	cmp    WORD PTR [eax],0x0
  449031:	74 13                	je     0x449046
  449033:	66 c7 00 00 00       	mov    WORD PTR [eax],0x0
  449038:	6a 00                	push   0x0
  44903a:	6a 00                	push   0x0
  44903c:	6a 0c                	push   0xc
  44903e:	e8 bd 0e 03 00       	call   0x479f00
  449043:	83 c4 0c             	add    esp,0xc
  449046:	6a 40                	push   0x40
  449048:	e8 73 61 06 00       	call   0x4af1c0
  44904d:	83 c4 04             	add    esp,0x4
  449050:	c3                   	ret
  449051:	cc                   	int3
  449052:	cc                   	int3
  449053:	cc                   	int3
  449054:	cc                   	int3
  449055:	cc                   	int3
  449056:	cc                   	int3
  449057:	cc                   	int3
  449058:	cc                   	int3
  449059:	cc                   	int3
  44905a:	cc                   	int3
  44905b:	cc                   	int3
  44905c:	cc                   	int3
  44905d:	cc                   	int3
  44905e:	cc                   	int3
  44905f:	cc                   	int3
  449060:	80 7c 24 04 00       	cmp    BYTE PTR [esp+0x4],0x0
  449065:	74 08                	je     0x44906f
  449067:	80 0d d7 9b 96 00 10 	or     BYTE PTR ds:0x969bd7,0x10
  44906e:	c3                   	ret
  44906f:	80 25 d7 9b 96 00 ef 	and    BYTE PTR ds:0x969bd7,0xef
  449076:	c3                   	ret
  449077:	cc                   	int3
  449078:	cc                   	int3
  449079:	cc                   	int3
  44907a:	cc                   	int3
  44907b:	cc                   	int3
  44907c:	cc                   	int3
  44907d:	cc                   	int3
  44907e:	cc                   	int3
  44907f:	cc                   	int3
  449080:	83 ec 08             	sub    esp,0x8
  449083:	f6 05 d7 9b 96 00 10 	test   BYTE PTR ds:0x969bd7,0x10
  44908a:	0f 84 a3 01 00 00    	je     0x449233
  449090:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  449097:	0f 84 96 01 00 00    	je     0x449233
  44909d:	33 c9                	xor    ecx,ecx
  44909f:	38 0d d4 9b 96 00    	cmp    BYTE PTR ds:0x969bd4,cl
  4490a5:	0f 85 38 01 00 00    	jne    0x4491e3
  4490ab:	f6 05 d7 9b 96 00 40 	test   BYTE PTR ds:0x969bd7,0x40
  4490b2:	0f 85 7b 01 00 00    	jne    0x449233
  4490b8:	8d 44 24 00          	lea    eax,[esp+0x0]
  4490bc:	89 0d 0a 9d 96 00    	mov    DWORD PTR ds:0x969d0a,ecx
  4490c2:	89 0d 1e 9d 96 00    	mov    DWORD PTR ds:0x969d1e,ecx
  4490c8:	89 0d 5e 9d 96 00    	mov    DWORD PTR ds:0x969d5e,ecx
  4490ce:	89 08                	mov    DWORD PTR [eax],ecx
  4490d0:	89 48 04             	mov    DWORD PTR [eax+0x4],ecx
  4490d3:	80 3d d5 9b 96 00 0a 	cmp    BYTE PTR ds:0x969bd5,0xa
  4490da:	66 0f be 05 d5 9b 96 	movsx  ax,BYTE PTR ds:0x969bd5
  4490e1:	00 
  4490e2:	66 89 4c 24 04       	mov    WORD PTR [esp+0x4],cx
  4490e7:	7f 06                	jg     0x4490ef
  4490e9:	66 6b c0 03          	imul   ax,ax,0x3
  4490ed:	eb 03                	jmp    0x4490f2
  4490ef:	66 03 c0             	add    ax,ax
  4490f2:	c6 44 24 00 01       	mov    BYTE PTR [esp+0x0],0x1
  4490f7:	c6 05 d6 9b 96 00 02 	mov    BYTE PTR ds:0x969bd6,0x2
  4490fe:	66 89 44 24 06       	mov    WORD PTR [esp+0x6],ax
  449103:	83 3d 48 cd 59 00 00 	cmp    DWORD PTR ds:0x59cd48,0x0
  44910a:	66 a1 da 9b 96 00    	mov    ax,ds:0x969bda
  449110:	66 8b 4c 24 06       	mov    cx,WORD PTR [esp+0x6]
  449115:	66 89 44 24 02       	mov    WORD PTR [esp+0x2],ax
  44911a:	66 89 0d e8 9c 96 00 	mov    WORD PTR ds:0x969ce8,cx
  449121:	66 c7 05 e6 9c 96 00 	mov    WORD PTR ds:0x969ce6,0x0
  449128:	00 00 
  44912a:	74 0e                	je     0x44913a
  44912c:	8d 44 24 00          	lea    eax,[esp+0x0]
  449130:	50                   	push   eax
  449131:	ff 15 48 cd 59 00    	call   DWORD PTR ds:0x59cd48
  449137:	83 c4 04             	add    esp,0x4
  44913a:	80 0d d6 9b 96 00 04 	or     BYTE PTR ds:0x969bd6,0x4
  449141:	66 a1 dc 9b 96 00    	mov    ax,ds:0x969bdc
  449147:	66 8b 4c 24 06       	mov    cx,WORD PTR [esp+0x6]
  44914c:	c6 44 24 00 02       	mov    BYTE PTR [esp+0x0],0x2
  449151:	83 3d 50 cd 59 00 00 	cmp    DWORD PTR ds:0x59cd50,0x0
  449158:	66 89 44 24 02       	mov    WORD PTR [esp+0x2],ax
  44915d:	66 89 0d ec 9c 96 00 	mov    WORD PTR ds:0x969cec,cx
  449164:	66 c7 05 ea 9c 96 00 	mov    WORD PTR ds:0x969cea,0x0
  44916b:	00 00 
  44916d:	74 0e                	je     0x44917d
  44916f:	8d 44 24 00          	lea    eax,[esp+0x0]
  449173:	50                   	push   eax
  449174:	ff 15 50 cd 59 00    	call   DWORD PTR ds:0x59cd50
  44917a:	83 c4 04             	add    esp,0x4
  44917d:	80 0d d6 9b 96 00 08 	or     BYTE PTR ds:0x969bd6,0x8
  449184:	66 a1 de 9b 96 00    	mov    ax,ds:0x969bde
  44918a:	66 8b 4c 24 06       	mov    cx,WORD PTR [esp+0x6]
  44918f:	c6 44 24 00 03       	mov    BYTE PTR [esp+0x0],0x3
  449194:	83 3d 58 cd 59 00 00 	cmp    DWORD PTR ds:0x59cd58,0x0
  44919b:	66 89 44 24 02       	mov    WORD PTR [esp+0x2],ax
  4491a0:	66 89 0d f0 9c 96 00 	mov    WORD PTR ds:0x969cf0,cx
  4491a7:	66 c7 05 ee 9c 96 00 	mov    WORD PTR ds:0x969cee,0x0
  4491ae:	00 00 
  4491b0:	74 0e                	je     0x4491c0
  4491b2:	8d 44 24 00          	lea    eax,[esp+0x0]
  4491b6:	50                   	push   eax
  4491b7:	ff 15 58 cd 59 00    	call   DWORD PTR ds:0x59cd58
  4491bd:	83 c4 04             	add    esp,0x4
  4491c0:	6a 00                	push   0x0
  4491c2:	a1 1c 3e 97 00       	mov    eax,ds:0x973e1c
  4491c7:	80 0d d7 9b 96 00 08 	or     BYTE PTR ds:0x969bd7,0x8
  4491ce:	80 0d d7 9b 96 00 40 	or     BYTE PTR ds:0x969bd7,0x40
  4491d5:	6a 00                	push   0x0
  4491d7:	6a 20                	push   0x20
  4491d9:	50                   	push   eax
  4491da:	e8 41 18 03 00       	call   0x47aa20
  4491df:	83 c4 18             	add    esp,0x18
  4491e2:	c3                   	ret
  4491e3:	80 25 d7 9b 96 00 fe 	and    BYTE PTR ds:0x969bd7,0xfe
  4491ea:	6a 01                	push   0x1
  4491ec:	e8 af 3d 05 00       	call   0x49cfa0
  4491f1:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4491f8:	8d 14 80             	lea    edx,[eax+eax*4]
  4491fb:	83 c4 04             	add    esp,0x4
  4491fe:	8b c8                	mov    ecx,eax
  449200:	8d 04 51             	lea    eax,[ecx+edx*2]
  449203:	8d 14 c0             	lea    edx,[eax+eax*8]
  449206:	8d 04 d1             	lea    eax,[ecx+edx*8]
  449209:	8d 84 81 fc d1 89 00 	lea    eax,[ecx+eax*4+0x89d1fc]
  449210:	66 83 38 00          	cmp    WORD PTR [eax],0x0
  449214:	74 13                	je     0x449229
  449216:	66 c7 00 00 00       	mov    WORD PTR [eax],0x0
  44921b:	6a 00                	push   0x0
  44921d:	6a 00                	push   0x0
  44921f:	6a 0c                	push   0xc
  449221:	e8 da 0c 03 00       	call   0x479f00
  449226:	83 c4 0c             	add    esp,0xc
  449229:	6a 40                	push   0x40
  44922b:	e8 90 5f 06 00       	call   0x4af1c0
  449230:	83 c4 04             	add    esp,0x4
  449233:	83                   	.byte 0x83
