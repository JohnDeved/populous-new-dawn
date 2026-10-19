
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004d32b0 <.text+0xd22b0>:
  4d32b0:	83 ec 08             	sub    esp,0x8
  4d32b3:	53                   	push   ebx
  4d32b4:	56                   	push   esi
  4d32b5:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  4d32b9:	57                   	push   edi
  4d32ba:	56                   	push   esi
  4d32bb:	e8 e0 0f 00 00       	call   0x4d42a0
  4d32c0:	83 c4 04             	add    esp,0x4
  4d32c3:	56                   	push   esi
  4d32c4:	e8 07 cc 04 00       	call   0x51fed0
  4d32c9:	83 c4 04             	add    esp,0x4
  4d32cc:	56                   	push   esi
  4d32cd:	e8 7e 5d 01 00       	call   0x4e9050
  4d32d2:	83 c4 04             	add    esp,0x4
  4d32d5:	56                   	push   esi
  4d32d6:	e8 25 3a 01 00       	call   0x4e6d00
  4d32db:	83 c4 04             	add    esp,0x4
  4d32de:	66 83 be 9f 00 00 00 	cmp    WORD PTR [esi+0x9f],0x0
  4d32e5:	00 
  4d32e6:	74 13                	je     0x4d32fb
  4d32e8:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4d32eb:	25 ff df ff ff       	and    eax,0xffffdfff
  4d32f0:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d32f3:	25 ff ff f7 ff       	and    eax,0xfff7ffff
  4d32f8:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d32fb:	8b 56 14             	mov    edx,DWORD PTR [esi+0x14]
  4d32fe:	f7 c2 00 00 01 00    	test   edx,0x10000
  4d3304:	74 35                	je     0x4d333b
  4d3306:	66 8b 46 72          	mov    ax,WORD PTR [esi+0x72]
  4d330a:	33 c9                	xor    ecx,ecx
  4d330c:	66 3b c1             	cmp    ax,cx
  4d330f:	74 17                	je     0x4d3328
  4d3311:	0f b7 c0             	movzx  eax,ax
  4d3314:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  4d331b:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  4d331f:	75 07                	jne    0x4d3328
  4d3321:	38 48 2a             	cmp    BYTE PTR [eax+0x2a],cl
  4d3324:	74 02                	je     0x4d3328
  4d3326:	8b c8                	mov    ecx,eax
  4d3328:	85 c9                	test   ecx,ecx
  4d332a:	75 0f                	jne    0x4d333b
  4d332c:	66 c7 46 72 00 00    	mov    WORD PTR [esi+0x72],0x0
  4d3332:	81 e2 ff ff fe ff    	and    edx,0xfffeffff
  4d3338:	89 56 14             	mov    DWORD PTR [esi+0x14],edx
  4d333b:	6a 01                	push   0x1
  4d333d:	56                   	push   esi
  4d333e:	e8 2d cf 00 00       	call   0x4e0270
  4d3343:	83 c4 08             	add    esp,0x8
  4d3346:	8a 4e 2b             	mov    cl,BYTE PTR [esi+0x2b]
  4d3349:	80 f9 05             	cmp    cl,0x5
  4d334c:	75 20                	jne    0x4d336e
  4d334e:	8a 9e b2 00 00 00    	mov    bl,BYTE PTR [esi+0xb2]
  4d3354:	8a c3                	mov    al,bl
  4d3356:	24 3f                	and    al,0x3f
  4d3358:	74 14                	je     0x4d336e
  4d335a:	33 d2                	xor    edx,edx
  4d335c:	8a d0                	mov    dl,al
  4d335e:	4a                   	dec    edx
  4d335f:	79 02                	jns    0x4d3363
  4d3361:	33 d2                	xor    edx,edx
  4d3363:	80 e3 c0             	and    bl,0xc0
  4d3366:	0a da                	or     bl,dl
  4d3368:	88 9e b2 00 00 00    	mov    BYTE PTR [esi+0xb2],bl
  4d336e:	8a 5e 2c             	mov    bl,BYTE PTR [esi+0x2c]
  4d3371:	33 c0                	xor    eax,eax
  4d3373:	8a c3                	mov    al,bl
  4d3375:	48                   	dec    eax
  4d3376:	83 f8 2b             	cmp    eax,0x2b
  4d3379:	0f 87 60 07 00 00    	ja     0x4d3adf
  4d337f:	ff 24 85 18 3d 4d 00 	jmp    DWORD PTR [eax*4+0x4d3d18]
  4d3386:	66 8b 46 70          	mov    ax,WORD PTR [esi+0x70]
  4d338a:	32 db                	xor    bl,bl
  4d338c:	66 48                	dec    ax
  4d338e:	66 89 46 70          	mov    WORD PTR [esi+0x70],ax
  4d3392:	66 85 c0             	test   ax,ax
  4d3395:	7e 0d                	jle    0x4d33a4
  4d3397:	f7 46 0c 04 20 00 00 	test   DWORD PTR [esi+0xc],0x2004
  4d339e:	0f 84 3d 07 00 00    	je     0x4d3ae1
  4d33a4:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  4d33ab:	74 22                	je     0x4d33cf
  4d33ad:	80 f9 07             	cmp    cl,0x7
  4d33b0:	75 07                	jne    0x4d33b9
  4d33b2:	b3 27                	mov    bl,0x27
  4d33b4:	e9 28 07 00 00       	jmp    0x4d3ae1
  4d33b9:	33 c0                	xor    eax,eax
  4d33bb:	8a c1                	mov    al,cl
  4d33bd:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4d33c0:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4d33c3:	8a 1c 55 64 70 5a 00 	mov    bl,BYTE PTR [edx*2+0x5a7064]
  4d33ca:	e9 12 07 00 00       	jmp    0x4d3ae1
  4d33cf:	33 c0                	xor    eax,eax
  4d33d1:	8a c1                	mov    al,cl
  4d33d3:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4d33d6:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4d33d9:	8a 1c 55 64 70 5a 00 	mov    bl,BYTE PTR [edx*2+0x5a7064]
  4d33e0:	e9 fc 06 00 00       	jmp    0x4d3ae1
  4d33e5:	56                   	push   esi
  4d33e6:	e8 75 27 00 00       	call   0x4d5b60
  4d33eb:	83 c4 04             	add    esp,0x4
  4d33ee:	8a d8                	mov    bl,al
  4d33f0:	e9 ec 06 00 00       	jmp    0x4d3ae1
  4d33f5:	56                   	push   esi
  4d33f6:	e8 f5 28 00 00       	call   0x4d5cf0
  4d33fb:	83 c4 04             	add    esp,0x4
  4d33fe:	8a d8                	mov    bl,al
  4d3400:	e9 dc 06 00 00       	jmp    0x4d3ae1
  4d3405:	66 ff 4e 70          	dec    WORD PTR [esi+0x70]
  4d3409:	0f 89 d0 06 00 00    	jns    0x4d3adf
  4d340f:	56                   	push   esi
  4d3410:	e8 ab 34 00 00       	call   0x4d68c0
  4d3415:	e9 c2 06 00 00       	jmp    0x4d3adc
  4d341a:	56                   	push   esi
  4d341b:	e8 50 35 00 00       	call   0x4d6970
  4d3420:	83 c4 04             	add    esp,0x4
  4d3423:	8a d8                	mov    bl,al
  4d3425:	e9 b7 06 00 00       	jmp    0x4d3ae1
  4d342a:	32 db                	xor    bl,bl
  4d342c:	56                   	push   esi
  4d342d:	e8 ae 32 00 00       	call   0x4d66e0
  4d3432:	83 c4 04             	add    esp,0x4
  4d3435:	85 c0                	test   eax,eax
  4d3437:	0f 85 a4 06 00 00    	jne    0x4d3ae1
  4d343d:	66 8b 46 70          	mov    ax,WORD PTR [esi+0x70]
  4d3441:	66 48                	dec    ax
  4d3443:	66 89 46 70          	mov    WORD PTR [esi+0x70],ax
  4d3447:	66 85 c0             	test   ax,ax
  4d344a:	7e 5f                	jle    0x4d34ab
  4d344c:	8d 7e 4f             	lea    edi,[esi+0x4f]
  4d344f:	57                   	push   edi
  4d3450:	e8 fb 1b f3 ff       	call   0x405050
  4d3455:	83 c4 04             	add    esp,0x4
  4d3458:	8a 40 0c             	mov    al,BYTE PTR [eax+0xc]
  4d345b:	24 0f                	and    al,0xf
  4d345d:	33 c9                	xor    ecx,ecx
  4d345f:	8a c8                	mov    cl,al
  4d3461:	8b c1                	mov    eax,ecx
  4d3463:	c1 e1 03             	shl    ecx,0x3
  4d3466:	2b c8                	sub    ecx,eax
  4d3468:	f6 04 4d 28 a3 5a 00 	test   BYTE PTR [ecx*2+0x5aa328],0x3c
  4d346f:	3c 
  4d3470:	74 29                	je     0x4d349b
  4d3472:	8d 46 3d             	lea    eax,[esi+0x3d]
  4d3475:	6a 02                	push   0x2
  4d3477:	57                   	push   edi
  4d3478:	6a 38                	push   0x38
  4d347a:	50                   	push   eax
  4d347b:	e8 20 f9 f5 ff       	call   0x432da0
  4d3480:	83 c4 10             	add    esp,0x10
  4d3483:	84 c0                	test   al,al
  4d3485:	0f 84 56 06 00 00    	je     0x4d3ae1
  4d348b:	56                   	push   esi
  4d348c:	b3 10                	mov    bl,0x10
  4d348e:	e8 dd 13 00 00       	call   0x4d4870
  4d3493:	83 c4 04             	add    esp,0x4
  4d3496:	e9 46 06 00 00       	jmp    0x4d3ae1
  4d349b:	56                   	push   esi
  4d349c:	e8 8f f9 f2 ff       	call   0x402e30
  4d34a1:	83 c4 04             	add    esp,0x4
  4d34a4:	8a d8                	mov    bl,al
  4d34a6:	e9 36 06 00 00       	jmp    0x4d3ae1
  4d34ab:	56                   	push   esi
  4d34ac:	e8 7f f9 f2 ff       	call   0x402e30
  4d34b1:	83 c4 04             	add    esp,0x4
  4d34b4:	8a d8                	mov    bl,al
  4d34b6:	e9 26 06 00 00       	jmp    0x4d3ae1
  4d34bb:	66 8b 46 70          	mov    ax,WORD PTR [esi+0x70]
  4d34bf:	32 db                	xor    bl,bl
  4d34c1:	66 48                	dec    ax
  4d34c3:	66 89 46 70          	mov    WORD PTR [esi+0x70],ax
  4d34c7:	66 85 c0             	test   ax,ax
  4d34ca:	7e 1d                	jle    0x4d34e9
  4d34cc:	f6 46 2e 03          	test   BYTE PTR [esi+0x2e],0x3
  4d34d0:	0f 85 0b 06 00 00    	jne    0x4d3ae1
  4d34d6:	68 ef 28 89 00       	push   0x8928ef
  4d34db:	56                   	push   esi
  4d34dc:	e8 9f 68 01 00       	call   0x4e9d80
  4d34e1:	83 c4 08             	add    esp,0x8
  4d34e4:	e9 f8 05 00 00       	jmp    0x4d3ae1
  4d34e9:	56                   	push   esi
  4d34ea:	e8 41 f9 f2 ff       	call   0x402e30
  4d34ef:	83 c4 04             	add    esp,0x4
  4d34f2:	8a d8                	mov    bl,al
  4d34f4:	e9 e8 05 00 00       	jmp    0x4d3ae1
  4d34f9:	56                   	push   esi
  4d34fa:	e8 d1 2b 00 00       	call   0x4d60d0
  4d34ff:	83 c4 04             	add    esp,0x4
  4d3502:	8a d8                	mov    bl,al
  4d3504:	e9 d8 05 00 00       	jmp    0x4d3ae1
  4d3509:	56                   	push   esi
  4d350a:	e8 d1 49 00 00       	call   0x4d7ee0
  4d350f:	83 c4 04             	add    esp,0x4
  4d3512:	8a d8                	mov    bl,al
  4d3514:	e9 c8 05 00 00       	jmp    0x4d3ae1
  4d3519:	56                   	push   esi
  4d351a:	e8 71 f0 f5 ff       	call   0x432590
  4d351f:	83 c4 04             	add    esp,0x4
  4d3522:	8a d8                	mov    bl,al
  4d3524:	e9 b8 05 00 00       	jmp    0x4d3ae1
  4d3529:	32 db                	xor    bl,bl
  4d352b:	56                   	push   esi
  4d352c:	e8 df 35 00 00       	call   0x4d6b10
  4d3531:	83 c4 04             	add    esp,0x4
  4d3534:	f6 46 0d 20          	test   BYTE PTR [esi+0xd],0x20
  4d3538:	0f 84 a3 05 00 00    	je     0x4d3ae1
  4d353e:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  4d3545:	74 24                	je     0x4d356b
  4d3547:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4d354a:	3c 07                	cmp    al,0x7
  4d354c:	75 07                	jne    0x4d3555
  4d354e:	b3 27                	mov    bl,0x27
  4d3550:	e9 8c 05 00 00       	jmp    0x4d3ae1
  4d3555:	33 c9                	xor    ecx,ecx
  4d3557:	8a c8                	mov    cl,al
  4d3559:	8d 04 89             	lea    eax,[ecx+ecx*4]
  4d355c:	8d 14 80             	lea    edx,[eax+eax*4]
  4d355f:	8a 1c 55 64 70 5a 00 	mov    bl,BYTE PTR [edx*2+0x5a7064]
  4d3566:	e9 76 05 00 00       	jmp    0x4d3ae1
  4d356b:	33 c0                	xor    eax,eax
  4d356d:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4d3570:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4d3573:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4d3576:	8a 1c 55 64 70 5a 00 	mov    bl,BYTE PTR [edx*2+0x5a7064]
  4d357d:	e9 5f 05 00 00       	jmp    0x4d3ae1
  4d3582:	32 db                	xor    bl,bl
  4d3584:	56                   	push   esi
  4d3585:	e8 86 35 00 00       	call   0x4d6b10
  4d358a:	83 c4 04             	add    esp,0x4
  4d358d:	f6 46 0d 20          	test   BYTE PTR [esi+0xd],0x20
  4d3591:	0f 84 4a 05 00 00    	je     0x4d3ae1
  4d3597:	56                   	push   esi
  4d3598:	e8 93 f8 f2 ff       	call   0x402e30
  4d359d:	83 c4 04             	add    esp,0x4
  4d35a0:	8a d8                	mov    bl,al
  4d35a2:	e9 3a 05 00 00       	jmp    0x4d3ae1
  4d35a7:	66 ff 4e 70          	dec    WORD PTR [esi+0x70]
  4d35ab:	79 09                	jns    0x4d35b6
  4d35ad:	56                   	push   esi
  4d35ae:	e8 0d 33 00 00       	call   0x4d68c0
  4d35b3:	83 c4 04             	add    esp,0x4
  4d35b6:	f6 46 2e 07          	test   BYTE PTR [esi+0x2e],0x7
  4d35ba:	0f 85 1f 05 00 00    	jne    0x4d3adf
  4d35c0:	66 8b 46 3d          	mov    ax,WORD PTR [esi+0x3d]
  4d35c4:	66 c1 e8 08          	shr    ax,0x8
  4d35c8:	8d 7e 68             	lea    edi,[esi+0x68]
  4d35cb:	24 fe                	and    al,0xfe
  4d35cd:	57                   	push   edi
  4d35ce:	88 44 24 10          	mov    BYTE PTR [esp+0x10],al
  4d35d2:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  4d35d6:	66 c1 e8 08          	shr    ax,0x8
  4d35da:	24 fe                	and    al,0xfe
  4d35dc:	88 44 24 11          	mov    BYTE PTR [esp+0x11],al
  4d35e0:	e8 6b 16 f3 ff       	call   0x404c50
  4d35e5:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  4d35e9:	83 c4 04             	add    esp,0x4
  4d35ec:	50                   	push   eax
  4d35ed:	51                   	push   ecx
  4d35ee:	e8 9d cf f7 ff       	call   0x450590
  4d35f3:	83 c4 08             	add    esp,0x8
  4d35f6:	83 f8 09             	cmp    eax,0x9
  4d35f9:	0f 8e e0 04 00 00    	jle    0x4d3adf
  4d35ff:	57                   	push   edi
  4d3600:	56                   	push   esi
  4d3601:	e8 7a 67 01 00       	call   0x4e9d80
  4d3606:	83 c4 08             	add    esp,0x8
  4d3609:	e9 d1 04 00 00       	jmp    0x4d3adf
  4d360e:	56                   	push   esi
  4d360f:	e8 fc 34 00 00       	call   0x4d6b10
  4d3614:	83 c4 04             	add    esp,0x4
  4d3617:	f6 46 2e 0f          	test   BYTE PTR [esi+0x2e],0xf
  4d361b:	74 0d                	je     0x4d362a
  4d361d:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  4d3624:	0f 84 b5 04 00 00    	je     0x4d3adf
  4d362a:	56                   	push   esi
  4d362b:	e8 50 b6 01 00       	call   0x4eec80
  4d3630:	e9 a7 04 00 00       	jmp    0x4d3adc
  4d3635:	56                   	push   esi
  4d3636:	e8 a5 35 00 00       	call   0x4d6be0
  4d363b:	83 c4 04             	add    esp,0x4
  4d363e:	8a d8                	mov    bl,al
  4d3640:	e9 9c 04 00 00       	jmp    0x4d3ae1
  4d3645:	56                   	push   esi
  4d3646:	e8 f5 37 00 00       	call   0x4d6e40
  4d364b:	83 c4 04             	add    esp,0x4
  4d364e:	8a d8                	mov    bl,al
  4d3650:	e9 8c 04 00 00       	jmp    0x4d3ae1
  4d3655:	32 db                	xor    bl,bl
  4d3657:	38 5e 7e             	cmp    BYTE PTR [esi+0x7e],bl
  4d365a:	75 16                	jne    0x4d3672
  4d365c:	8d 46 3d             	lea    eax,[esi+0x3d]
  4d365f:	8d 4e 4f             	lea    ecx,[esi+0x4f]
  4d3662:	51                   	push   ecx
  4d3663:	50                   	push   eax
  4d3664:	e8 67 07 00 00       	call   0x4d3dd0
  4d3669:	83 c4 08             	add    esp,0x8
  4d366c:	84 c0                	test   al,al
  4d366e:	74 02                	je     0x4d3672
  4d3670:	b3 13                	mov    bl,0x13
  4d3672:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4d3675:	a9 04 20 00 00       	test   eax,0x2004
  4d367a:	75 13                	jne    0x4d368f
  4d367c:	f6 46 2e 0f          	test   BYTE PTR [esi+0x2e],0xf
  4d3680:	0f 85 5b 04 00 00    	jne    0x4d3ae1
  4d3686:	f6 c4 08             	test   ah,0x8
  4d3689:	0f 84 52 04 00 00    	je     0x4d3ae1
  4d368f:	66 8b 46 68          	mov    ax,WORD PTR [esi+0x68]
  4d3693:	6a 00                	push   0x0
  4d3695:	66 89 44 24 10       	mov    WORD PTR [esp+0x10],ax
  4d369a:	8d 44 24 10          	lea    eax,[esp+0x10]
  4d369e:	66 8b 4e 6a          	mov    cx,WORD PTR [esi+0x6a]
  4d36a2:	50                   	push   eax
  4d36a3:	66 89 4c 24 16       	mov    WORD PTR [esp+0x16],cx
  4d36a8:	66 c7 44 24 18 00 00 	mov    WORD PTR [esp+0x18],0x0
  4d36af:	e8 4c 4b 04 00       	call   0x518200
  4d36b4:	83 c4 08             	add    esp,0x8
  4d36b7:	84 c0                	test   al,al
  4d36b9:	0f 84 22 04 00 00    	je     0x4d3ae1
  4d36bf:	83 4e 0c 10          	or     DWORD PTR [esi+0xc],0x10
  4d36c3:	e9 19 04 00 00       	jmp    0x4d3ae1
  4d36c8:	32 db                	xor    bl,bl
  4d36ca:	8d 46 3d             	lea    eax,[esi+0x3d]
  4d36cd:	68 00 02 00 00       	push   0x200
  4d36d2:	8d 4e 4f             	lea    ecx,[esi+0x4f]
  4d36d5:	51                   	push   ecx
  4d36d6:	6a 38                	push   0x38
  4d36d8:	50                   	push   eax
  4d36d9:	e8 c2 f6 f5 ff       	call   0x432da0
  4d36de:	83 c4 10             	add    esp,0x10
  4d36e1:	84 c0                	test   al,al
  4d36e3:	0f 84 f8 03 00 00    	je     0x4d3ae1
  4d36e9:	8a 5e 7d             	mov    bl,BYTE PTR [esi+0x7d]
  4d36ec:	e9 f0 03 00 00       	jmp    0x4d3ae1
  4d36f1:	56                   	push   esi
  4d36f2:	e8 e9 3c 00 00       	call   0x4d73e0
  4d36f7:	83 c4 04             	add    esp,0x4
  4d36fa:	8a d8                	mov    bl,al
  4d36fc:	e9 e0 03 00 00       	jmp    0x4d3ae1
  4d3701:	66 8b 46 70          	mov    ax,WORD PTR [esi+0x70]
  4d3705:	66 85 c0             	test   ax,ax
  4d3708:	74 0f                	je     0x4d3719
  4d370a:	66 48                	dec    ax
  4d370c:	66 89 46 70          	mov    WORD PTR [esi+0x70],ax
  4d3710:	66 85 c0             	test   ax,ax
  4d3713:	7f 04                	jg     0x4d3719
  4d3715:	80 4e 35 02          	or     BYTE PTR [esi+0x35],0x2
  4d3719:	0f be 46 2f          	movsx  eax,BYTE PTR [esi+0x2f]
  4d371d:	8b c8                	mov    ecx,eax
  4d371f:	8d 14 80             	lea    edx,[eax+eax*4]
  4d3722:	8d 04 51             	lea    eax,[ecx+edx*2]
  4d3725:	8d 1c c0             	lea    ebx,[eax+eax*8]
  4d3728:	8d 14 d9             	lea    edx,[ecx+ebx*8]
  4d372b:	80 bc 91 e7 dd 89 00 	cmp    BYTE PTR [ecx+edx*4+0x89dde7],0x1
  4d3732:	01 
  4d3733:	0f 85 a6 03 00 00    	jne    0x4d3adf
  4d3739:	66 8b 86 83 00 00 00 	mov    ax,WORD PTR [esi+0x83]
  4d3740:	33 c9                	xor    ecx,ecx
  4d3742:	66 40                	inc    ax
  4d3744:	66 89 86 83 00 00 00 	mov    WORD PTR [esi+0x83],ax
  4d374b:	0f bf c0             	movsx  eax,ax
  4d374e:	66 8b 4e 24          	mov    cx,WORD PTR [esi+0x24]
  4d3752:	81 e1 ff 00 00 00    	and    ecx,0xff
  4d3758:	81 c1 00 04 00 00    	add    ecx,0x400
  4d375e:	3b c8                	cmp    ecx,eax
  4d3760:	0f 8f 79 03 00 00    	jg     0x4d3adf
  4d3766:	66 c7 86 83 00 00 00 	mov    WORD PTR [esi+0x83],0x0
  4d376d:	00 00 
  4d376f:	56                   	push   esi
  4d3770:	e8 db 63 00 00       	call   0x4d9b50
  4d3775:	e9 62 03 00 00       	jmp    0x4d3adc
  4d377a:	66 8b 46 70          	mov    ax,WORD PTR [esi+0x70]
  4d377e:	66 48                	dec    ax
