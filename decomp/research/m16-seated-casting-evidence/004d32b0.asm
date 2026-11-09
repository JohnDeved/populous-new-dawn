
../populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


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
  4d3780:	66 89 46 70          	mov    WORD PTR [esi+0x70],ax
  4d3784:	66 85 c0             	test   ax,ax
  4d3787:	0f 8f 52 03 00 00    	jg     0x4d3adf
  4d378d:	8d 7e 49             	lea    edi,[esi+0x49]
  4d3790:	57                   	push   edi
  4d3791:	e8 5a 5f 01 00       	call   0x4e96f0
  4d3796:	83 c4 04             	add    esp,0x4
  4d3799:	57                   	push   edi
  4d379a:	e8 31 5f 01 00       	call   0x4e96d0
  4d379f:	83 c4 04             	add    esp,0x4
  4d37a2:	8d 7e 3d             	lea    edi,[esi+0x3d]
  4d37a5:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d37ab:	56                   	push   esi
  4d37ac:	e8 3f fa ff ff       	call   0x4d31f0
  4d37b1:	83 c4 04             	add    esp,0x4
  4d37b4:	57                   	push   edi
  4d37b5:	56                   	push   esi
  4d37b6:	e8 15 66 01 00       	call   0x4e9dd0
  4d37bb:	83 c4 08             	add    esp,0x8
  4d37be:	80 be a8 00 00 00 00 	cmp    BYTE PTR [esi+0xa8],0x0
  4d37c5:	74 30                	je     0x4d37f7
  4d37c7:	8b 07                	mov    eax,DWORD PTR [edi]
  4d37c9:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  4d37cd:	8d 44 24 0c          	lea    eax,[esp+0xc]
  4d37d1:	50                   	push   eax
  4d37d2:	56                   	push   esi
  4d37d3:	e8 48 ed f5 ff       	call   0x432520
  4d37d8:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  4d37dc:	83 c4 08             	add    esp,0x8
  4d37df:	51                   	push   ecx
  4d37e0:	56                   	push   esi
  4d37e1:	e8 8a f6 f2 ff       	call   0x402e70
  4d37e6:	66 8b 4e 5d          	mov    cx,WORD PTR [esi+0x5d]
  4d37ea:	83 c4 08             	add    esp,0x8
  4d37ed:	51                   	push   ecx
  4d37ee:	56                   	push   esi
  4d37ef:	e8 0c 06 00 00       	call   0x4d3e00
  4d37f4:	83 c4 08             	add    esp,0x8
  4d37f7:	56                   	push   esi
  4d37f8:	e8 33 06 00 00       	call   0x4d3e30
  4d37fd:	e9 da 02 00 00       	jmp    0x4d3adc
  4d3802:	56                   	push   esi
  4d3803:	e8 a8 4b 00 00       	call   0x4d83b0
  4d3808:	83 c4 04             	add    esp,0x4
  4d380b:	8a d8                	mov    bl,al
  4d380d:	e9 cf 02 00 00       	jmp    0x4d3ae1
  4d3812:	56                   	push   esi
  4d3813:	e8 28 56 00 00       	call   0x4d8e40
  4d3818:	83 c4 04             	add    esp,0x4
  4d381b:	8a d8                	mov    bl,al
  4d381d:	e9 bf 02 00 00       	jmp    0x4d3ae1
  4d3822:	56                   	push   esi
  4d3823:	e8 38 4d 04 00       	call   0x518560
  4d3828:	83 c4 04             	add    esp,0x4
  4d382b:	8a d8                	mov    bl,al
  4d382d:	e9 af 02 00 00       	jmp    0x4d3ae1
  4d3832:	32 db                	xor    bl,bl
  4d3834:	f6 46 10 10          	test   BYTE PTR [esi+0x10],0x10
  4d3838:	75 0d                	jne    0x4d3847
  4d383a:	6a 00                	push   0x0
  4d383c:	6a 51                	push   0x51
  4d383e:	56                   	push   esi
  4d383f:	e8 0c 68 fb ff       	call   0x48a050
  4d3844:	83 c4 0c             	add    esp,0xc
  4d3847:	66 ff 4e 70          	dec    WORD PTR [esi+0x70]
  4d384b:	0f 89 90 02 00 00    	jns    0x4d3ae1
  4d3851:	56                   	push   esi
  4d3852:	e8 d9 f5 f2 ff       	call   0x402e30
  4d3857:	83 c4 04             	add    esp,0x4
  4d385a:	8a d8                	mov    bl,al
  4d385c:	8b 46 3d             	mov    eax,DWORD PTR [esi+0x3d]
  4d385f:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  4d3863:	8d 44 24 0c          	lea    eax,[esp+0xc]
  4d3867:	50                   	push   eax
  4d3868:	56                   	push   esi
  4d3869:	e8 b2 ec f5 ff       	call   0x432520
  4d386e:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  4d3872:	83 c4 08             	add    esp,0x8
  4d3875:	51                   	push   ecx
  4d3876:	56                   	push   esi
  4d3877:	e8 f4 f5 f2 ff       	call   0x402e70
  4d387c:	83 c4 08             	add    esp,0x8
  4d387f:	e9 5d 02 00 00       	jmp    0x4d3ae1
  4d3884:	56                   	push   esi
  4d3885:	e8 f6 b3 01 00       	call   0x4eec80
  4d388a:	83 c4 04             	add    esp,0x4
  4d388d:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4d3890:	25 ff ff ef ff       	and    eax,0xffefffff
  4d3895:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d3898:	a9 00 00 10 00       	test   eax,0x100000
  4d389d:	75 1c                	jne    0x4d38bb
  4d389f:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  4d38a2:	56                   	push   esi
  4d38a3:	88 46 7d             	mov    BYTE PTR [esi+0x7d],al
  4d38a6:	e8 45 9e 01 00       	call   0x4ed6f0
  4d38ab:	83 c4 04             	add    esp,0x4
  4d38ae:	c6 46 2c 03          	mov    BYTE PTR [esi+0x2c],0x3
  4d38b2:	56                   	push   esi
  4d38b3:	e8 88 9d 01 00       	call   0x4ed640
  4d38b8:	83 c4 04             	add    esp,0x4
  4d38bb:	83 66 0c fd          	and    DWORD PTR [esi+0xc],0xfffffffd
  4d38bf:	e9 1b 02 00 00       	jmp    0x4d3adf
  4d38c4:	56                   	push   esi
  4d38c5:	e8 b6 80 00 00       	call   0x4db980
  4d38ca:	83 c4 04             	add    esp,0x4
  4d38cd:	8a d8                	mov    bl,al
  4d38cf:	e9 0d 02 00 00       	jmp    0x4d3ae1
  4d38d4:	56                   	push   esi
  4d38d5:	e8 86 4c 04 00       	call   0x518560
  4d38da:	83 c4 04             	add    esp,0x4
  4d38dd:	8a d8                	mov    bl,al
  4d38df:	e9 fd 01 00 00       	jmp    0x4d3ae1
  4d38e4:	32 c0                	xor    al,al
  4d38e6:	66 83 be 9f 00 00 00 	cmp    WORD PTR [esi+0x9f],0x0
  4d38ed:	00 
  4d38ee:	75 09                	jne    0x4d38f9
  4d38f0:	56                   	push   esi
  4d38f1:	e8 3a f5 f2 ff       	call   0x402e30
  4d38f6:	83 c4 04             	add    esp,0x4
  4d38f9:	8a d8                	mov    bl,al
  4d38fb:	e9 e1 01 00 00       	jmp    0x4d3ae1
  4d3900:	56                   	push   esi
  4d3901:	e8 7a 57 00 00       	call   0x4d9080
  4d3906:	83 c4 04             	add    esp,0x4
  4d3909:	8a d8                	mov    bl,al
  4d390b:	e9 d1 01 00 00       	jmp    0x4d3ae1
  4d3910:	56                   	push   esi
  4d3911:	e8 0a 5b 00 00       	call   0x4d9420
  4d3916:	83 c4 04             	add    esp,0x4
  4d3919:	8a d8                	mov    bl,al
  4d391b:	e9 c1 01 00 00       	jmp    0x4d3ae1
  4d3920:	56                   	push   esi
  4d3921:	e8 2a 5d 00 00       	call   0x4d9650
  4d3926:	83 c4 04             	add    esp,0x4
  4d3929:	8a d8                	mov    bl,al
  4d392b:	e9 b1 01 00 00       	jmp    0x4d3ae1
  4d3930:	66 8b 46 72          	mov    ax,WORD PTR [esi+0x72]
  4d3934:	32 db                	xor    bl,bl
  4d3936:	50                   	push   eax
  4d3937:	e8 a4 3e f3 ff       	call   0x4077e0
  4d393c:	83 c4 04             	add    esp,0x4
  4d393f:	85 c0                	test   eax,eax
  4d3941:	74 60                	je     0x4d39a3
  4d3943:	83 c0 3d             	add    eax,0x3d
  4d3946:	8d 4e 3d             	lea    ecx,[esi+0x3d]
  4d3949:	50                   	push   eax
  4d394a:	51                   	push   ecx
  4d394b:	e8 70 eb f5 ff       	call   0x4324c0
  4d3950:	66 8b f8             	mov    di,ax
  4d3953:	83 c4 08             	add    esp,0x8
  4d3956:	56                   	push   esi
  4d3957:	e8 04 6b 01 00       	call   0x4ea460
  4d395c:	83 c4 04             	add    esp,0x4
  4d395f:	8b 4e 0c             	mov    ecx,DWORD PTR [esi+0xc]
  4d3962:	81 c9 80 00 00 00    	or     ecx,0x80
  4d3968:	89 4e 0c             	mov    DWORD PTR [esi+0xc],ecx
  4d396b:	81 c9 00 10 00 00    	or     ecx,0x1000
  4d3971:	89 4e 0c             	mov    DWORD PTR [esi+0xc],ecx
  4d3974:	66 89 7e 57          	mov    WORD PTR [esi+0x57],di
  4d3978:	66 8b 46 70          	mov    ax,WORD PTR [esi+0x70]
  4d397c:	66 48                	dec    ax
  4d397e:	66 89 46 70          	mov    WORD PTR [esi+0x70],ax
  4d3982:	66 85 c0             	test   ax,ax
  4d3985:	7e 0c                	jle    0x4d3993
  4d3987:	f7 c1 04 20 00 00    	test   ecx,0x2004
  4d398d:	0f 84 4e 01 00 00    	je     0x4d3ae1
  4d3993:	56                   	push   esi
  4d3994:	e8 97 f4 f2 ff       	call   0x402e30
  4d3999:	83 c4 04             	add    esp,0x4
  4d399c:	8a d8                	mov    bl,al
  4d399e:	e9 3e 01 00 00       	jmp    0x4d3ae1
  4d39a3:	56                   	push   esi
  4d39a4:	e8 87 f4 f2 ff       	call   0x402e30
  4d39a9:	83 c4 04             	add    esp,0x4
  4d39ac:	8a d8                	mov    bl,al
  4d39ae:	e9 2e 01 00 00       	jmp    0x4d3ae1
  4d39b3:	66 8b 46 70          	mov    ax,WORD PTR [esi+0x70]
  4d39b7:	32 db                	xor    bl,bl
  4d39b9:	66 48                	dec    ax
  4d39bb:	66 89 46 70          	mov    WORD PTR [esi+0x70],ax
  4d39bf:	66 85 c0             	test   ax,ax
  4d39c2:	0f 8f 19 01 00 00    	jg     0x4d3ae1
  4d39c8:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  4d39cf:	74 22                	je     0x4d39f3
  4d39d1:	80 f9 07             	cmp    cl,0x7
  4d39d4:	75 07                	jne    0x4d39dd
  4d39d6:	b3 27                	mov    bl,0x27
  4d39d8:	e9 04 01 00 00       	jmp    0x4d3ae1
  4d39dd:	33 c0                	xor    eax,eax
  4d39df:	8a c1                	mov    al,cl
  4d39e1:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4d39e4:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4d39e7:	8a 1c 55 64 70 5a 00 	mov    bl,BYTE PTR [edx*2+0x5a7064]
  4d39ee:	e9 ee 00 00 00       	jmp    0x4d3ae1
  4d39f3:	33 c0                	xor    eax,eax
  4d39f5:	8a c1                	mov    al,cl
  4d39f7:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4d39fa:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4d39fd:	8a 1c 55 64 70 5a 00 	mov    bl,BYTE PTR [edx*2+0x5a7064]
  4d3a04:	e9 d8 00 00 00       	jmp    0x4d3ae1
  4d3a09:	56                   	push   esi
  4d3a0a:	e8 11 b8 00 00       	call   0x4df220
  4d3a0f:	83 c4 04             	add    esp,0x4
  4d3a12:	8a d8                	mov    bl,al
  4d3a14:	e9 c8 00 00 00       	jmp    0x4d3ae1
  4d3a19:	56                   	push   esi
  4d3a1a:	e8 31 ba 00 00       	call   0x4df450
  4d3a1f:	83 c4 04             	add    esp,0x4
  4d3a22:	8a d8                	mov    bl,al
  4d3a24:	e9 b8 00 00 00       	jmp    0x4d3ae1
  4d3a29:	56                   	push   esi
  4d3a2a:	e8 41 bc 00 00       	call   0x4df670
  4d3a2f:	83 c4 04             	add    esp,0x4
  4d3a32:	8a d8                	mov    bl,al
  4d3a34:	e9 a8 00 00 00       	jmp    0x4d3ae1
  4d3a39:	56                   	push   esi
  4d3a3a:	e8 81 c2 00 00       	call   0x4dfcc0
  4d3a3f:	83 c4 04             	add    esp,0x4
  4d3a42:	8a d8                	mov    bl,al
  4d3a44:	e9 98 00 00 00       	jmp    0x4d3ae1
  4d3a49:	56                   	push   esi
  4d3a4a:	e8 11 cd 00 00       	call   0x4e0760
  4d3a4f:	83 c4 04             	add    esp,0x4
  4d3a52:	8a d8                	mov    bl,al
  4d3a54:	e9 88 00 00 00       	jmp    0x4d3ae1
  4d3a59:	56                   	push   esi
  4d3a5a:	e8 91 d0 00 00       	call   0x4e0af0
  4d3a5f:	83 c4 04             	add    esp,0x4
  4d3a62:	8a d8                	mov    bl,al
  4d3a64:	eb 7b                	jmp    0x4d3ae1
  4d3a66:	56                   	push   esi
  4d3a67:	e8 04 ee 00 00       	call   0x4e2870
  4d3a6c:	83 c4 04             	add    esp,0x4
  4d3a6f:	8a d8                	mov    bl,al
  4d3a71:	eb 6e                	jmp    0x4d3ae1
  4d3a73:	56                   	push   esi
  4d3a74:	e8 67 f5 00 00       	call   0x4e2fe0
  4d3a79:	83 c4 04             	add    esp,0x4
  4d3a7c:	8a d8                	mov    bl,al
  4d3a7e:	eb 61                	jmp    0x4d3ae1
