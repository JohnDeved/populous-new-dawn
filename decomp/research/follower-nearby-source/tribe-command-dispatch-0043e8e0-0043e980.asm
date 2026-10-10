
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0043e8e0 <.text+0x3d8e0>:
  43e8e0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  43e8e4:	81 ec d0 03 00 00    	sub    esp,0x3d0
  43e8ea:	53                   	push   ebx
  43e8eb:	8a 90 22 0c 00 00    	mov    dl,BYTE PTR [eax+0xc22]
  43e8f1:	88 54 24 08          	mov    BYTE PTR [esp+0x8],dl
  43e8f5:	56                   	push   esi
  43e8f6:	57                   	push   edi
  43e8f7:	33 f6                	xor    esi,esi
  43e8f9:	55                   	push   ebp
  43e8fa:	33 c9                	xor    ecx,ecx
  43e8fc:	8b 84 24 e8 03 00 00 	mov    eax,DWORD PTR [esp+0x3e8]
  43e903:	89 74 24 20          	mov    DWORD PTR [esp+0x20],esi
  43e907:	89 74 24 2c          	mov    DWORD PTR [esp+0x2c],esi
  43e90b:	8a 48 0c             	mov    cl,BYTE PTR [eax+0xc]
  43e90e:	83 e9 0c             	sub    ecx,0xc
  43e911:	83 f9 7a             	cmp    ecx,0x7a
  43e914:	0f 87 7a 39 00 00    	ja     0x442294
  43e91a:	33 c0                	xor    eax,eax
  43e91c:	8a 81 f0 23 44 00    	mov    al,BYTE PTR [ecx+0x4423f0]
  43e922:	ff 24 85 c0 22 44 00 	jmp    DWORD PTR [eax*4+0x4422c0]
  43e929:	8b 84 24 e8 03 00 00 	mov    eax,DWORD PTR [esp+0x3e8]
  43e930:	8b 40 04             	mov    eax,DWORD PTR [eax+0x4]
  43e933:	48                   	dec    eax
  43e934:	83 f8 03             	cmp    eax,0x3
  43e937:	0f 87 57 39 00 00    	ja     0x442294
  43e93d:	ff 24 85 6c 24 44 00 	jmp    DWORD PTR [eax*4+0x44246c]
  43e944:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  43e94b:	74 2c                	je     0x43e979
  43e94d:	be ed 00 00 00       	mov    esi,0xed
  43e952:	33 c9                	xor    ecx,ecx
  43e954:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  43e95b:	8a 4c 24 14          	mov    cl,BYTE PTR [esp+0x14]
  43e95f:	3b c1                	cmp    eax,ecx
  43e961:	75 36                	jne    0x43e999
  43e963:	81 25 61 c6 89 00 ff 	and    DWORD PTR ds:0x89c661,0xf7ffffff
  43e96a:	ff ff f7 
  43e96d:	c7 05 8f 5d 89 00 02 	mov    DWORD PTR ds:0x895d8f,0x2
  43e974:	00 00 00 
  43e977:	eb 20                	jmp    0x43e999
  43e979:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
