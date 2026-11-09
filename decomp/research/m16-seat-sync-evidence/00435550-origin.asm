
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00435550 <.text+0x34550>:
  435550:	83 ec 14             	sub    esp,0x14
  435553:	53                   	push   ebx
  435554:	56                   	push   esi
  435555:	57                   	push   edi
  435556:	33 f6                	xor    esi,esi
  435558:	8b 7c 24 24          	mov    edi,DWORD PTR [esp+0x24]
  43555c:	55                   	push   ebp
  43555d:	66 8b 87 9f 00 00 00 	mov    ax,WORD PTR [edi+0x9f]
  435564:	66 3b c6             	cmp    ax,si
  435567:	74 18                	je     0x435581
  435569:	0f b7 c0             	movzx  eax,ax
  43556c:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  435573:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  435577:	75 08                	jne    0x435581
  435579:	80 78 2a 00          	cmp    BYTE PTR [eax+0x2a],0x0
  43557d:	74 02                	je     0x435581
  43557f:	8b f0                	mov    esi,eax
  435581:	85 f6                	test   esi,esi
  435583:	0f 84 8c 01 00 00    	je     0x435715
  435589:	8d 5f 3d             	lea    ebx,[edi+0x3d]
  43558c:	8b 44 24 2c          	mov    eax,DWORD PTR [esp+0x2c]
  435590:	66 8b 08             	mov    cx,WORD PTR [eax]
  435593:	66 2b 0b             	sub    cx,WORD PTR [ebx]
  435596:	0f b7 c9             	movzx  ecx,cx
  435599:	66 8b 40 02          	mov    ax,WORD PTR [eax+0x2]
  43559d:	8b d1                	mov    edx,ecx
  43559f:	66 2b 47 3f          	sub    ax,WORD PTR [edi+0x3f]
  4355a3:	85 c9                	test   ecx,ecx
  4355a5:	0f b7 c0             	movzx  eax,ax
  4355a8:	7d 04                	jge    0x4355ae
  4355aa:	8b d1                	mov    edx,ecx
  4355ac:	f7 da                	neg    edx
  4355ae:	8b e8                	mov    ebp,eax
  4355b0:	85 c0                	test   eax,eax
  4355b2:	7d 04                	jge    0x4355b8
  4355b4:	8b e8                	mov    ebp,eax
  4355b6:	f7 dd                	neg    ebp
  4355b8:	81 fa 00 80 00 00    	cmp    edx,0x8000
  4355be:	7c 06                	jl     0x4355c6
  4355c0:	8d 8a 00 00 ff ff    	lea    ecx,[edx-0x10000]
  4355c6:	81 fd 00 80 00 00    	cmp    ebp,0x8000
  4355cc:	7c 06                	jl     0x4355d4
  4355ce:	8d 85 00 00 ff ff    	lea    eax,[ebp-0x10000]
  4355d4:	f7 d8                	neg    eax
  4355d6:	50                   	push   eax
  4355d7:	51                   	push   ecx
  4355d8:	e8 97 0a 15 00       	call   0x586074
  4355dd:	8d 54 24 20          	lea    edx,[esp+0x20]
  4355e1:	83 c4 08             	add    esp,0x8
  4355e4:	33 c9                	xor    ecx,ecx
  4355e6:	68 00 03 00 00       	push   0x300
  4355eb:	66 8b c8             	mov    cx,ax
  4355ee:	8b 03                	mov    eax,DWORD PTR [ebx]
  4355f0:	66 8b 5b 04          	mov    bx,WORD PTR [ebx+0x4]
  4355f4:	81 e1 ff 07 00 00    	and    ecx,0x7ff
  4355fa:	51                   	push   ecx
  4355fb:	89 02                	mov    DWORD PTR [edx],eax
  4355fd:	66 89 5a 04          	mov    WORD PTR [edx+0x4],bx
  435601:	8d 54 24 20          	lea    edx,[esp+0x20]
  435605:	52                   	push   edx
  435606:	e8 65 14 0b 00       	call   0x4e6a70
  43560b:	8d 44 24 24          	lea    eax,[esp+0x24]
  43560f:	83 c4 0c             	add    esp,0xc
  435612:	6a 00                	push   0x0
  435614:	50                   	push   eax
  435615:	e8 e6 2b 0e 00       	call   0x518200
  43561a:	83 c4 08             	add    esp,0x8
  43561d:	84 c0                	test   al,al
  43561f:	74 2d                	je     0x43564e
  435621:	8d 44 24 14          	lea    eax,[esp+0x14]
  435625:	50                   	push   eax
  435626:	56                   	push   esi
  435627:	e8 64 0b 03 00       	call   0x466190
  43562c:	66 8b 4c 24 1e       	mov    cx,WORD PTR [esp+0x1e]
  435631:	83 c4 08             	add    esp,0x8
  435634:	8a d8                	mov    bl,al
  435636:	66 8b 44 24 14       	mov    ax,WORD PTR [esp+0x14]
  43563b:	66 89 44 24 18       	mov    WORD PTR [esp+0x18],ax
  435640:	66 89 4c 24 1a       	mov    WORD PTR [esp+0x1a],cx
  435645:	66 c7 44 24 1c 00 00 	mov    WORD PTR [esp+0x1c],0x0
  43564c:	eb 04                	jmp    0x435652
  43564e:	8a                   	.byte 0x8a
  43564f:	5c                   	pop    esp
