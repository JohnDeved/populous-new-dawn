
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004ce2c0 <.text+0xcd2c0>:
  4ce2c0:	83 ec 78             	sub    esp,0x78
  4ce2c3:	b8 ff ff ff ff       	mov    eax,0xffffffff
  4ce2c8:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  4ce2cc:	53                   	push   ebx
  4ce2cd:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  4ce2d1:	56                   	push   esi
  4ce2d2:	89 44 24 3c          	mov    DWORD PTR [esp+0x3c],eax
  4ce2d6:	57                   	push   edi
  4ce2d7:	89 44 24 44          	mov    DWORD PTR [esp+0x44],eax
  4ce2db:	55                   	push   ebp
  4ce2dc:	89 44 24 4c          	mov    DWORD PTR [esp+0x4c],eax
  4ce2e0:	89 44 24 50          	mov    DWORD PTR [esp+0x50],eax
  4ce2e4:	89 44 24 54          	mov    DWORD PTR [esp+0x54],eax
  4ce2e8:	89 44 24 58          	mov    DWORD PTR [esp+0x58],eax
  4ce2ec:	89 44 24 5c          	mov    DWORD PTR [esp+0x5c],eax
  4ce2f0:	89 44 24 60          	mov    DWORD PTR [esp+0x60],eax
  4ce2f4:	8b ac 24 8c 00 00 00 	mov    ebp,DWORD PTR [esp+0x8c]
  4ce2fb:	89 44 24 64          	mov    DWORD PTR [esp+0x64],eax
  4ce2ff:	c7 44 24 34 00 00 00 	mov    DWORD PTR [esp+0x34],0x0
  4ce306:	00 
  4ce307:	c7 44 24 38 01 00 00 	mov    DWORD PTR [esp+0x38],0x1
  4ce30e:	00 
  4ce30f:	8b 9d 81 08 00 00    	mov    ebx,DWORD PTR [ebp+0x881]
  4ce315:	85 db                	test   ebx,ebx
  4ce317:	0f 84 ca 08 00 00    	je     0x4cebe7
  4ce31d:	8b bc 24 90 00 00 00 	mov    edi,DWORD PTR [esp+0x90]
  4ce324:	8b 84 24 94 00 00 00 	mov    eax,DWORD PTR [esp+0x94]
  4ce32b:	50                   	push   eax
  4ce32c:	53                   	push   ebx
  4ce32d:	e8 2e 41 02 00       	call   0x4f2460
  4ce332:	83 c4 08             	add    esp,0x8
  4ce335:	85 c0                	test   eax,eax
  4ce337:	0f 84 9f 08 00 00    	je     0x4cebdc
  4ce33d:	f6 43 0c 01          	test   BYTE PTR [ebx+0xc],0x1
  4ce341:	0f 85 95 08 00 00    	jne    0x4cebdc
  4ce347:	53                   	push   ebx
  4ce348:	e8 b3 57 02 00       	call   0x4f3b00
  4ce34d:	83 c4 04             	add    esp,0x4
  4ce350:	85 c0                	test   eax,eax
  4ce352:	0f 85 6a 07 00 00    	jne    0x4ceac2
  4ce358:	83 7c 24 38 00       	cmp    DWORD PTR [esp+0x38],0x0
  4ce35d:	74 1f                	je     0x4ce37e
  4ce35f:	f6 47 08 03          	test   BYTE PTR [edi+0x8],0x3
  4ce363:	75 19                	jne    0x4ce37e
  4ce365:	8b 84 24 98 00 00 00 	mov    eax,DWORD PTR [esp+0x98]
  4ce36c:	50                   	push   eax
  4ce36d:	57                   	push   edi
  4ce36e:	e8 cd 4a 02 00       	call   0x4f2e40
  4ce373:	c7 44 24 40 00 00 00 	mov    DWORD PTR [esp+0x40],0x0
  4ce37a:	00 
  4ce37b:	83 c4 08             	add    esp,0x8
  4ce37e:	33 c0                	xor    eax,eax
  4ce380:	8a 43 2b             	mov    al,BYTE PTR [ebx+0x2b]
  4ce383:	83 e8 04             	sub    eax,0x4
  4ce386:	83 f8 03             	cmp    eax,0x3
  4ce389:	77 07                	ja     0x4ce392
  4ce38b:	ff 24 85 f4 eb 4c 00 	jmp    DWORD PTR [eax*4+0x4cebf4]
  4ce392:	33 c0                	xor    eax,eax
  4ce394:	ff 44 24 34          	inc    DWORD PTR [esp+0x34]
  4ce398:	8a 43 2c             	mov    al,BYTE PTR [ebx+0x2c]
  4ce39b:	f6 84 80 79 6f 5a 00 	test   BYTE PTR [eax+eax*4+0x5a6f79],0x8
  4ce3a2:	08 
  4ce3a3:	0f 84 33 08 00 00    	je     0x4cebdc
