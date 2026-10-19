
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004e3500 <.text+0xe2500>:
  4e3500:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4e3504:	83 ec 04             	sub    esp,0x4
  4e3507:	83 3d bc 48 5d 00 00 	cmp    DWORD PTR ds:0x5d48bc,0x0
  4e350e:	56                   	push   esi
  4e350f:	a3 94 48 5d 00       	mov    ds:0x5d4894,eax
  4e3514:	75 6d                	jne    0x4e3583
  4e3516:	33 f6                	xor    esi,esi
  4e3518:	eb 06                	jmp    0x4e3520
  4e351a:	d9 9e 94 d2 a0 00    	fstp   DWORD PTR [esi+0xa0d294]
  4e3520:	83 c6 04             	add    esi,0x4
  4e3523:	e8 f8 9f 07 00       	call   0x55d520
  4e3528:	99                   	cdq
  4e3529:	b9 7f 00 00 00       	mov    ecx,0x7f
  4e352e:	f7 f9                	idiv   ecx
  4e3530:	89 54 24 04          	mov    DWORD PTR [esp+0x4],edx
  4e3534:	db 44 24 04          	fild   DWORD PTR [esp+0x4]
  4e3538:	d8 0d dc f7 58 00    	fmul   DWORD PTR ds:0x58f7dc
  4e353e:	d8 05 e0 f7 58 00    	fadd   DWORD PTR ds:0x58f7e0
  4e3544:	d9 9e 8c 86 a1 00    	fstp   DWORD PTR [esi+0xa1868c]
  4e354a:	e8 d1 9f 07 00       	call   0x55d520
  4e354f:	99                   	cdq
  4e3550:	b9 7f 00 00 00       	mov    ecx,0x7f
  4e3555:	f7 f9                	idiv   ecx
  4e3557:	89 54 24 04          	mov    DWORD PTR [esp+0x4],edx
  4e355b:	81 fe 00 20 00 00    	cmp    esi,0x2000
  4e3561:	db 44 24 04          	fild   DWORD PTR [esp+0x4]
  4e3565:	d8 0d dc f7 58 00    	fmul   DWORD PTR ds:0x58f7dc
  4e356b:	d8 05 e0 f7 58 00    	fadd   DWORD PTR ds:0x58f7e0
  4e3571:	7c a7                	jl     0x4e351a
  4e3573:	d9 9e 94 d2 a0 00    	fstp   DWORD PTR [esi+0xa0d294]
  4e3579:	c7 05 bc 48 5d 00 01 	mov    DWORD PTR ds:0x5d48bc,0x1
  4e3580:	00 00 00 
  4e3583:	5e                   	pop    esi
  4e3584:	83 c4 04             	add    esp,0x4
  4e3587:	c3                   	ret
  4e3588:	cc                   	int3
  4e3589:	cc                   	int3
  4e358a:	cc                   	int3
  4e358b:	cc                   	int3
  4e358c:	cc                   	int3
  4e358d:	cc                   	int3
  4e358e:	cc                   	int3
  4e358f:	cc                   	int3
  4e3590:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4e3594:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  4e3598:	8b 54 24 0c          	mov    edx,DWORD PTR [esp+0xc]
  4e359c:	a3 98 f2 a0 00       	mov    ds:0xa0f298,eax
  4e35a1:	89 0d 9c f2 a0 00    	mov    DWORD PTR ds:0xa0f29c,ecx
  4e35a7:	89 15 68 46 a1 00    	mov    DWORD PTR ds:0xa14668,edx
  4e35ad:	c3                   	ret
  4e35ae:	cc                   	int3
  4e35af:	cc                   	int3
  4e35b0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4e35b4:	a3 84 48 5d 00       	mov    ds:0x5d4884,eax
  4e35b9:	c3                   	ret
  4e35ba:	cc                   	int3
  4e35bb:	cc                   	int3
  4e35bc:	cc                   	int3
  4e35bd:	cc                   	int3
  4e35be:	cc                   	int3
  4e35bf:	cc                   	int3
  4e35c0:	d9 44 24 04          	fld    DWORD PTR [esp+0x4]
  4e35c4:	d8 25 a4 f2 a0 00    	fsub   DWORD PTR ds:0xa0f2a4
  4e35ca:	d9 44 24 08          	fld    DWORD PTR [esp+0x8]
  4e35ce:	d8 25 a0 f2 a0 00    	fsub   DWORD PTR ds:0xa0f2a0
  4e35d4:	d9 05 18 a7 a1 00    	fld    DWORD PTR ds:0xa1a718
  4e35da:	83 ec 0c             	sub    esp,0xc
  4e35dd:	d8 3d e4 f7 58 00    	fdivr  DWORD PTR ds:0x58f7e4
  4e35e3:	d9 c0                	fld    st(0)
  4e35e5:	d8 cb                	fmul   st,st(3)
  4e35e7:	d9 c9                	fxch   st(1)
  4e35e9:	d8 ca                	fmul   st,st(2)
  4e35eb:	d9 c1                	fld    st(1)
  4e35ed:	d8 ca                	fmul   st,st(2)
  4e35ef:	d9 c1                	fld    st(1)
  4e35f1:	d8 ca                	fmul   st,st(2)
  4e35f3:	de c1                	faddp  st(1),st
  4e35f5:	dd 05 e8 f7 58 00    	fld    QWORD PTR ds:0x58f7e8
  4e35fb:	d8 e1                	fsub   st,st(1)
  4e35fd:	d9 fa                	fsqrt
  4e35ff:	d8 0d f0 f7 58 00    	fmul   DWORD PTR ds:0x58f7f0
  4e3605:	d9 05 f4 f7 58 00    	fld    DWORD PTR ds:0x58f7f4
  4e360b:	d8 cb                	fmul   st,st(3)
  4e360d:	de e9                	fsubp  st(1),st
  4e360f:	d9 05 f4 f7 58 00    	fld    DWORD PTR ds:0x58f7f4
  4e3615:	d8 cc                	fmul   st,st(4)
  4e3617:	de c1                	faddp  st(1),st
  4e3619:	d9 54 24 00          	fst    DWORD PTR [esp+0x0]
  4e361d:	d8 4c 24 00          	fmul   DWORD PTR [esp+0x0]
  4e3621:	dc c8                	fmul   st(0),st
  4e3623:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  4e3627:	d8 25 f8 f7 58 00    	fsub   DWORD PTR ds:0x58f7f8
  4e362d:	d8 0d fc f7 58 00    	fmul   DWORD PTR ds:0x58f7fc
  4e3633:	d8 15 00 f8 58 00    	fcom   DWORD PTR ds:0x58f800
  4e3639:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4e363d:	df e0                	fnstsw ax
  4e363f:	dd d8                	fstp   st(0)
  4e3641:	dd d8                	fstp   st(0)
  4e3643:	dd d8                	fstp   st(0)
  4e3645:	dd d8                	fstp   st(0)
  4e3647:	f6 c4 01             	test   ah,0x1
  4e364a:	74 08                	je     0x4e3654
  4e364c:	c7 44 24 08 00 00 00 	mov    DWORD PTR [esp+0x8],0x0
  4e3653:	00 
  4e3654:	d9 44 24 00          	fld    DWORD PTR [esp+0x0]
  4e3658:	d8 0d f4 f7 58 00    	fmul   DWORD PTR ds:0x58f7f4
  4e365e:	b8 cd cc 4c be       	mov    eax,0xbe4ccccd
  4e3663:	d9 5c 24 00          	fstp   DWORD PTR [esp+0x0]
  4e3667:	d9 44 24 04          	fld    DWORD PTR [esp+0x4]
  4e366b:	d8 0d 04 f8 58 00    	fmul   DWORD PTR ds:0x58f804
  4e3671:	39 44 24 00          	cmp    DWORD PTR [esp+0x0],eax
  4e3675:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  4e3679:	76 04                	jbe    0x4e367f
  4e367b:	89 44 24 00          	mov    DWORD PTR [esp+0x0],eax
  4e367f:	d9 44 24 04          	fld    DWORD PTR [esp+0x4]
  4e3683:	d8 44 24 00          	fadd   DWORD PTR [esp+0x0]
  4e3687:	d8 44 24 08          	fadd   DWORD PTR [esp+0x8]
  4e368b:	d8 05 f4 f7 58 00    	fadd   DWORD PTR ds:0x58f7f4
  4e3691:	d8 0d 0c f8 58 00    	fmul   DWORD PTR ds:0x58f80c
  4e3697:	e8 b8 85 07 00       	call   0x55bc54
  4e369c:	3d aa 00 00 00       	cmp    eax,0xaa
  4e36a1:	7e 05                	jle    0x4e36a8
  4e36a3:	b8 aa 00 00 00       	mov    eax,0xaa
  4e36a8:	83 f8 38             	cmp    eax,0x38
  4e36ab:	7d 05                	jge    0x4e36b2
  4e36ad:	b8 38 00 00 00       	mov    eax,0x38
  4e36b2:	83 c4 0c             	add    esp,0xc
  4e36b5:	c3                   	ret
  4e36b6:	cc                   	int3
  4e36b7:	cc                   	int3
  4e36b8:	cc                   	int3
  4e36b9:	cc                   	int3
  4e36ba:	cc                   	int3
  4e36bb:	cc                   	int3
  4e36bc:	cc                   	int3
  4e36bd:	cc                   	int3
  4e36be:	cc                   	int3
  4e36bf:	cc                   	int3
  4e36c0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4e36c4:	83 ec 04             	sub    esp,0x4
  4e36c7:	8b 0d 88 48 5d 00    	mov    ecx,DWORD PTR ds:0x5d4888
  4e36cd:	56                   	push   esi
  4e36ce:	c1 e1 05             	shl    ecx,0x5
  4e36d1:	57                   	push   edi
  4e36d2:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  4e36d6:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  4e36da:	d9 05 68 46 a1 00    	fld    DWORD PTR ds:0xa14668
  4e36e0:	d8 4c 24 28          	fmul   DWORD PTR [esp+0x28]
  4e36e4:	d9 44 24 24          	fld    DWORD PTR [esp+0x24]
  4e36e8:	89 81 20 07 a2 00    	mov    DWORD PTR [ecx+0xa20720],eax
  4e36ee:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  4e36f2:	d8 c9                	fmul   st,st(1)
  4e36f4:	89 91 24 07 a2 00    	mov    DWORD PTR [ecx+0xa20724],edx
  4e36fa:	89 b1 28 07 a2 00    	mov    DWORD PTR [ecx+0xa20728],esi
  4e3700:	d8 2d 98 f2 a0 00    	fsubr  DWORD PTR ds:0xa0f298
  4e3706:	83 3d 94 48 5d 00 00 	cmp    DWORD PTR ds:0x5d4894,0x0
  4e370d:	89 81 2c 07 a2 00    	mov    DWORD PTR [ecx+0xa2072c],eax
  4e3713:	d9 99 38 07 a2 00    	fstp   DWORD PTR [ecx+0xa20738]
  4e3719:	d8 4c 24 20          	fmul   DWORD PTR [esp+0x20]
  4e371d:	d8 2d 9c f2 a0 00    	fsubr  DWORD PTR ds:0xa0f29c
  4e3723:	0f 84 d2 00 00 00    	je     0x4e37fb
  4e3729:	d9 99 3c 07 a2 00    	fstp   DWORD PTR [ecx+0xa2073c]
  4e372f:	a1 88 48 5d 00       	mov    eax,ds:0x5d4888
  4e3734:	8d 34 85 90 86 a1 00 	lea    esi,[eax*4+0xa18690]
  4e373b:	f7 06 ff ff ff 7f    	test   DWORD PTR [esi],0x7fffffff
  4e3741:	75 1d                	jne    0x4e3760
  4e3743:	e8 d8 9d 07 00       	call   0x55d520
  4e3748:	99                   	cdq
  4e3749:	b9 7f 00 00 00       	mov    ecx,0x7f
  4e374e:	f7 f9                	idiv   ecx
  4e3750:	89 54 24 08          	mov    DWORD PTR [esp+0x8],edx
  4e3754:	db 44 24 08          	fild   DWORD PTR [esp+0x8]
  4e3758:	d8 0d 10 f8 58 00    	fmul   DWORD PTR ds:0x58f810
  4e375e:	d9 1e                	fstp   DWORD PTR [esi]
  4e3760:	a1 88 48 5d 00       	mov    eax,ds:0x5d4888
  4e3765:	8d 34 85 98 d2 a0 00 	lea    esi,[eax*4+0xa0d298]
  4e376c:	f7 06 ff ff ff 7f    	test   DWORD PTR [esi],0x7fffffff
  4e3772:	75 1d                	jne    0x4e3791
  4e3774:	e8 a7 9d 07 00       	call   0x55d520
  4e3779:	99                   	cdq
  4e377a:	b9 7f 00 00 00       	mov    ecx,0x7f
  4e377f:	f7 f9                	idiv   ecx
  4e3781:	89 54 24 08          	mov    DWORD PTR [esp+0x8],edx
  4e3785:	db 44 24 08          	fild   DWORD PTR [esp+0x8]
  4e3789:	d8 0d 10 f8 58 00    	fmul   DWORD PTR ds:0x58f810
  4e378f:	d9 1e                	fstp   DWORD PTR [esi]
  4e3791:	a1 88 48 5d 00       	mov    eax,ds:0x5d4888
  4e3796:	c1 e0 02             	shl    eax,0x2
  4e3799:	8b 0d 88 48 5d 00    	mov    ecx,DWORD PTR ds:0x5d4888
  4e379f:	c1 e1 05             	shl    ecx,0x5
  4e37a2:	d9 80 90 86 a1 00    	fld    DWORD PTR [eax+0xa18690]
  4e37a8:	d8 80 90 66 a1 00    	fadd   DWORD PTR [eax+0xa16690]
  4e37ae:	d9 98 90 66 a1 00    	fstp   DWORD PTR [eax+0xa16690]
  4e37b4:	d9 80 98 d2 a0 00    	fld    DWORD PTR [eax+0xa0d298]
  4e37ba:	d8 80 90 46 a1 00    	fadd   DWORD PTR [eax+0xa14690]
  4e37c0:	d9 98 90 46 a1 00    	fstp   DWORD PTR [eax+0xa14690]
  4e37c6:	a1 88 48 5d 00       	mov    eax,ds:0x5d4888
  4e37cb:	d9 04 85 90 66 a1 00 	fld    DWORD PTR [eax*4+0xa16690]
  4e37d2:	d9 ff                	fcos
  4e37d4:	d8 0d 14 f8 58 00    	fmul   DWORD PTR ds:0x58f814
  4e37da:	d8 81 38 07 a2 00    	fadd   DWORD PTR [ecx+0xa20738]
  4e37e0:	d9 99 38 07 a2 00    	fstp   DWORD PTR [ecx+0xa20738]
  4e37e6:	d9 04 85 90 46 a1 00 	fld    DWORD PTR [eax*4+0xa14690]
  4e37ed:	d9 ff                	fcos
  4e37ef:	d8 0d 14 f8 58 00    	fmul   DWORD PTR ds:0x58f814
  4e37f5:	d8 81 3c 07 a2 00    	fadd   DWORD PTR [ecx+0xa2073c]
  4e37fb:	d9 99 3c 07 a2 00    	fstp   DWORD PTR [ecx+0xa2073c]
  4e3801:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4e3805:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  4e3809:	50                   	push   eax
  4e380a:	be ff 00 00 00       	mov    esi,0xff
  4e380f:	51                   	push   ecx
  4e3810:	e8 ab fd ff ff       	call   0x4e35c0
  4e3815:	83 c4 08             	add    esp,0x8
  4e3818:	83 f8 7f             	cmp    eax,0x7f
  4e381b:	7f 07                	jg     0x4e3824
  4e381d:	8d 34 45 00 00 00 00 	lea    esi,[eax*2+0x0]
  4e3824:	33 d2                	xor    edx,edx
  4e3826:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4e382c:	39 91 dc 06 00 00    	cmp    DWORD PTR [ecx+0x6dc],edx
  4e3832:	74 0e                	je     0x4e3842
  4e3834:	8d 14 45 00 ff ff ff 	lea    edx,[eax*2-0x100]
  4e383b:	83 f8 7f             	cmp    eax,0x7f
  4e383e:	7f 02                	jg     0x4e3842
  4e3840:	33 d2                	xor    edx,edx
  4e3842:	8b 3d 88 48 5d 00    	mov    edi,DWORD PTR ds:0x5d4888
  4e3848:	8b c6                	mov    eax,esi
  4e384a:	c1 e7 05             	shl    edi,0x5
  4e384d:	0d 00 00 ff ff       	or     eax,0xffff0000
  4e3852:	c1 e0 08             	shl    eax,0x8
  4e3855:	8b ce                	mov    ecx,esi
  4e3857:	c1 e1 10             	shl    ecx,0x10
  4e385a:	0b c1                	or     eax,ecx
  4e385c:	8b ca                	mov    ecx,edx
  4e385e:	c1 e1 08             	shl    ecx,0x8
  4e3861:	0b c6                	or     eax,esi
  4e3863:	89 87 30 07 a2 00    	mov    DWORD PTR [edi+0xa20730],eax
  4e3869:	ff 05 88 48 5d 00    	inc    DWORD PTR ds:0x5d4888
  4e386f:	8b c2                	mov    eax,edx
  4e3871:	c1 e0 10             	shl    eax,0x10
  4e3874:	0b c1                	or     eax,ecx
  4e3876:	0b c2                	or     eax,edx
  4e3878:	89 87 34 07 a2 00    	mov    DWORD PTR [edi+0xa20734],eax
  4e387e:	5f                   	pop    edi
  4e387f:	5e                   	pop    esi
  4e3880:	83 c4 04             	add    esp,0x4
  4e3883:	c3                   	ret
  4e3884:	cc                   	int3
  4e3885:	cc                   	int3
  4e3886:	cc                   	int3
  4e3887:	cc                   	int3
  4e3888:	cc                   	int3
  4e3889:	cc                   	int3
  4e388a:	cc                   	int3
  4e388b:	cc                   	int3
  4e388c:	cc                   	int3
  4e388d:	cc                   	int3
  4e388e:	cc                   	int3
  4e388f:	cc                   	int3
  4e3890:	83 ec 08             	sub    esp,0x8
  4e3893:	83 3d 84 48 5d 00 00 	cmp    DWORD PTR ds:0x5d4884,0x0
  4e389a:	53                   	push   ebx
  4e389b:	56                   	push   esi
  4e389c:	57                   	push   edi
  4e389d:	55                   	push   ebp
  4e389e:	0f 84 4c 01 00 00    	je     0x4e39f0
  4e38a4:	bb ff 00 00 00       	mov    ebx,0xff
  4e38a9:	88 5c 24 12          	mov    BYTE PTR [esp+0x12],bl
  4e38ad:	53                   	push   ebx
  4e38ae:	88 5c 24 15          	mov    BYTE PTR [esp+0x15],bl
  4e38b2:	53                   	push   ebx
  4e38b3:	88 5c 24 18          	mov    BYTE PTR [esp+0x18],bl
  4e38b7:	53                   	push   ebx
  4e38b8:	88 5c 24 1f          	mov    BYTE PTR [esp+0x1f],bl
  4e38bc:	68 28 55 d0 00       	push   0xd05528
  4e38c1:	e8 9a 2d 04 00       	call   0x526660
  4e38c6:	8b 6c 24 30          	mov    ebp,DWORD PTR [esp+0x30]
  4e38ca:	8b 7c 24 2c          	mov    edi,DWORD PTR [esp+0x2c]
  4e38ce:	c1 e5 05             	shl    ebp,0x5
  4e38d1:	88 44 24 24          	mov    BYTE PTR [esp+0x24],al
  4e38d5:	c1 e7 05             	shl    edi,0x5
  4e38d8:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  4e38dc:	d9 85 24 07 a2 00    	fld    DWORD PTR [ebp+0xa20724]
  4e38e2:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  4e38e6:	83 c4 10             	add    esp,0x10
  4e38e9:	50                   	push   eax
  4e38ea:	51                   	push   ecx
  4e38eb:	e8 64 83 07 00       	call   0x55bc54
  4e38f0:	d9 85 20 07 a2 00    	fld    DWORD PTR [ebp+0xa20720]
  4e38f6:	50                   	push   eax
  4e38f7:	e8 58 83 07 00       	call   0x55bc54
  4e38fc:	d9 87 24 07 a2 00    	fld    DWORD PTR [edi+0xa20724]
  4e3902:	50                   	push   eax
  4e3903:	e8 4c 83 07 00       	call   0x55bc54
  4e3908:	d9 87 20 07 a2 00    	fld    DWORD PTR [edi+0xa20720]
  4e390e:	50                   	push   eax
  4e390f:	e8 40 83 07 00       	call   0x55bc54
  4e3914:	50                   	push   eax
  4e3915:	e8 d6 44 04 00       	call   0x527df0
  4e391a:	88 5c 24 2a          	mov    BYTE PTR [esp+0x2a],bl
  4e391e:	83 c4 18             	add    esp,0x18
  4e3921:	88 5c 24 11          	mov    BYTE PTR [esp+0x11],bl
  4e3925:	53                   	push   ebx
  4e3926:	88 5c 24 14          	mov    BYTE PTR [esp+0x14],bl
  4e392a:	53                   	push   ebx
  4e392b:	88 5c 24 1b          	mov    BYTE PTR [esp+0x1b],bl
  4e392f:	53                   	push   ebx
  4e3930:	68 28 55 d0 00       	push   0xd05528
  4e3935:	e8 26 2d 04 00       	call   0x526660
  4e393a:	8b 74 24 34          	mov    esi,DWORD PTR [esp+0x34]
  4e393e:	88 44 24 24          	mov    BYTE PTR [esp+0x24],al
  4e3942:	c1 e6 05             	shl    esi,0x5
  4e3945:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  4e3949:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  4e394d:	83 c4 10             	add    esp,0x10
  4e3950:	50                   	push   eax
  4e3951:	51                   	push   ecx
  4e3952:	d9 86 24 07 a2 00    	fld    DWORD PTR [esi+0xa20724]
  4e3958:	e8 f7 82 07 00       	call   0x55bc54
  4e395d:	50                   	push   eax
  4e395e:	d9 86 20 07 a2 00    	fld    DWORD PTR [esi+0xa20720]
  4e3964:	e8 eb 82 07 00       	call   0x55bc54
  4e3969:	50                   	push   eax
  4e396a:	d9 85 24 07 a2 00    	fld    DWORD PTR [ebp+0xa20724]
  4e3970:	e8 df 82 07 00       	call   0x55bc54
  4e3975:	50                   	push   eax
  4e3976:	d9 85 20 07 a2 00    	fld    DWORD PTR [ebp+0xa20720]
  4e397c:	e8 d3 82 07 00       	call   0x55bc54
  4e3981:	50                   	push   eax
  4e3982:	e8 69 44 04 00       	call   0x527df0
  4e3987:	88 5c 24 2a          	mov    BYTE PTR [esp+0x2a],bl
  4e398b:	83 c4 18             	add    esp,0x18
  4e398e:	88 5c 24 11          	mov    BYTE PTR [esp+0x11],bl
  4e3992:	53                   	push   ebx
  4e3993:	88 5c 24 14          	mov    BYTE PTR [esp+0x14],bl
  4e3997:	53                   	push   ebx
  4e3998:	88 5c 24 1b          	mov    BYTE PTR [esp+0x1b],bl
  4e399c:	53                   	push   ebx
  4e399d:	68 28 55 d0 00       	push   0xd05528
  4e39a2:	e8 b9 2c 04 00       	call   0x526660
  4e39a7:	d9 87 24 07 a2 00    	fld    DWORD PTR [edi+0xa20724]
  4e39ad:	88 44 24 24          	mov    BYTE PTR [esp+0x24],al
  4e39b1:	83 c4 10             	add    esp,0x10
  4e39b4:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4e39b8:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  4e39bc:	50                   	push   eax
  4e39bd:	51                   	push   ecx
  4e39be:	e8 91 82 07 00       	call   0x55bc54
  4e39c3:	d9 87 20 07 a2 00    	fld    DWORD PTR [edi+0xa20720]
  4e39c9:	50                   	push   eax
  4e39ca:	e8 85 82 07 00       	call   0x55bc54
  4e39cf:	d9 86 24 07 a2 00    	fld    DWORD PTR [esi+0xa20724]
  4e39d5:	50                   	push   eax
  4e39d6:	e8 79 82 07 00       	call   0x55bc54
  4e39db:	d9 86 20 07 a2 00    	fld    DWORD PTR [esi+0xa20720]
  4e39e1:	50                   	push   eax
  4e39e2:	e8 6d 82 07 00       	call   0x55bc54
  4e39e7:	50                   	push   eax
  4e39e8:	e8 03 44 04 00       	call   0x527df0
  4e39ed:	83 c4 18             	add    esp,0x18
  4e39f0:	66 8b 44 24 1c       	mov    ax,WORD PTR [esp+0x1c]
  4e39f5:	8b 15 90 48 5d 00    	mov    edx,DWORD PTR ds:0x5d4890
  4e39fb:	66 89 04 55 20 a7 a1 	mov    WORD PTR [edx*2+0xa1a720],ax
  4e3a02:	00 
  4e3a03:	ff 05 8c 48 5d 00    	inc    DWORD PTR ds:0x5d488c
  4e3a09:	66 8b 5c 24 20       	mov    bx,WORD PTR [esp+0x20]
  4e3a0e:	8d 0c 55 00 00 00 00 	lea    ecx,[edx*2+0x0]
  4e3a15:	66 8b 6c 24 24       	mov    bp,WORD PTR [esp+0x24]
  4e3a1a:	83 c2 03             	add    edx,0x3
  4e3a1d:	66 89 99 22 a7 a1 00 	mov    WORD PTR [ecx+0xa1a722],bx
  4e3a24:	89 15 90 48 5d 00    	mov    DWORD PTR ds:0x5d4890,edx
  4e3a2a:	66 89 a9 24 a7 a1 00 	mov    WORD PTR [ecx+0xa1a724],bp
  4e3a31:	5d                   	pop    ebp
  4e3a32:	5f                   	pop    edi
  4e3a33:	5e                   	pop    esi
  4e3a34:	5b                   	pop    ebx
  4e3a35:	83 c4 08             	add    esp,0x8
  4e3a38:	c3                   	ret
  4e3a39:	cc                   	int3
  4e3a3a:	cc                   	int3
  4e3a3b:	cc                   	int3
  4e3a3c:	cc                   	int3
  4e3a3d:	cc                   	int3
  4e3a3e:	cc                   	int3
  4e3a3f:	cc                   	int3
  4e3a40:	83 3d 8c 46 a1 00 00 	cmp    DWORD PTR ds:0xa1468c,0x0
  4e3a47:	0f 85 68 01 00 00    	jne    0x4e3bb5
  4e3a4d:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  4e3a52:	6a 05                	push   0x5
  4e3a54:	6a 13                	push   0x13
  4e3a56:	8b 80 48 06 00 00    	mov    eax,DWORD PTR [eax+0x648]
  4e3a5c:	50                   	push   eax
  4e3a5d:	8b 00                	mov    eax,DWORD PTR [eax]
  4e3a5f:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  4e3a62:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4e3a68:	6a 06                	push   0x6
  4e3a6a:	6a 14                	push   0x14
  4e3a6c:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  4e3a72:	50                   	push   eax
  4e3a73:	8b 00                	mov    eax,DWORD PTR [eax]
  4e3a75:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  4e3a78:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4e3a7e:	6a 00                	push   0x0
  4e3a80:	6a 01                	push   0x1
  4e3a82:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  4e3a88:	50                   	push   eax
  4e3a89:	8b 00                	mov    eax,DWORD PTR [eax]
  4e3a8b:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  4e3a8e:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4e3a94:	6a 01                	push   0x1
  4e3a96:	6a 1b                	push   0x1b
  4e3a98:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  4e3a9e:	50                   	push   eax
  4e3a9f:	8b 00                	mov    eax,DWORD PTR [eax]
  4e3aa1:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  4e3aa4:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4e3aaa:	6a 00                	push   0x0
  4e3aac:	6a 29                	push   0x29
  4e3aae:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  4e3ab4:	50                   	push   eax
  4e3ab5:	8b 00                	mov    eax,DWORD PTR [eax]
  4e3ab7:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  4e3aba:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4e3ac0:	6a 00                	push   0x0
  4e3ac2:	6a 0f                	push   0xf
  4e3ac4:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  4e3aca:	50                   	push   eax
  4e3acb:	8b 00                	mov    eax,DWORD PTR [eax]
  4e3acd:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  4e3ad0:	6a 00                	push   0x0
  4e3ad2:	8b 0d 88 46 a1 00    	mov    ecx,DWORD PTR ds:0xa14688
  4e3ad8:	d9 05 7c 46 a1 00    	fld    DWORD PTR ds:0xa1467c
  4e3ade:	d8 05 80 46 a1 00    	fadd   DWORD PTR ds:0xa14680
  4e3ae4:	51                   	push   ecx
  4e3ae5:	8b 15 84 46 a1 00    	mov    edx,DWORD PTR ds:0xa14684
  4e3aeb:	52                   	push   edx
  4e3aec:	8b c2                	mov    eax,edx
  4e3aee:	0d 00 00 00 ff       	or     eax,0xff000000
  4e3af3:	50                   	push   eax
  4e3af4:	83 ec 04             	sub    esp,0x4
  4e3af7:	8b 0d 78 46 a1 00    	mov    ecx,DWORD PTR ds:0xa14678
  4e3afd:	83 ec 04             	sub    esp,0x4
  4e3b00:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  4e3b04:	d9 05 80 46 a1 00    	fld    DWORD PTR ds:0xa14680
  4e3b0a:	d8 0d 08 f8 58 00    	fmul   DWORD PTR ds:0x58f808
  4e3b10:	d8 05 7c 46 a1 00    	fadd   DWORD PTR ds:0xa1467c
  4e3b16:	d9 1c 24             	fstp   DWORD PTR [esp]
  4e3b19:	51                   	push   ecx
  4e3b1a:	8b 15 74 46 a1 00    	mov    edx,DWORD PTR ds:0xa14674
  4e3b20:	a1 70 46 a1 00       	mov    eax,ds:0xa14670
  4e3b25:	52                   	push   edx
  4e3b26:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4e3b2c:	50                   	push   eax
  4e3b2d:	8b 91 48 06 00 00    	mov    edx,DWORD PTR [ecx+0x648]
  4e3b33:	52                   	push   edx
  4e3b34:	e8 77 07 00 00       	call   0x4e42b0
  4e3b39:	83 c4 28             	add    esp,0x28
  4e3b3c:	8b 0d 88 46 a1 00    	mov    ecx,DWORD PTR ds:0xa14688
  4e3b42:	a1 84 46 a1 00       	mov    eax,ds:0xa14684
  4e3b47:	6a 00                	push   0x0
  4e3b49:	d9 05 80 46 a1 00    	fld    DWORD PTR ds:0xa14680
  4e3b4f:	d8 0d 08 f8 58 00    	fmul   DWORD PTR ds:0x58f808
  4e3b55:	51                   	push   ecx
  4e3b56:	0d 00 00 00 ff       	or     eax,0xff000000
  4e3b5b:	50                   	push   eax
  4e3b5c:	a1 84 46 a1 00       	mov    eax,ds:0xa14684
  4e3b61:	d8 05 7c 46 a1 00    	fadd   DWORD PTR ds:0xa1467c
  4e3b67:	50                   	push   eax
  4e3b68:	8b 0d 78 46 a1 00    	mov    ecx,DWORD PTR ds:0xa14678
  4e3b6e:	83 ec 04             	sub    esp,0x4
  4e3b71:	8b 15 74 46 a1 00    	mov    edx,DWORD PTR ds:0xa14674
  4e3b77:	83 ec 04             	sub    esp,0x4
  4e3b7a:	a1 70 46 a1 00       	mov    eax,ds:0xa14670
  4e3b7f:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  4e3b83:	d9 05 7c 46 a1 00    	fld    DWORD PTR ds:0xa1467c
  4e3b89:	d8 25 80 46 a1 00    	fsub   DWORD PTR ds:0xa14680
  4e3b8f:	51                   	push   ecx
  4e3b90:	52                   	push   edx
  4e3b91:	50                   	push   eax
  4e3b92:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4e3b98:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  4e3b9c:	8b 91 48 06 00 00    	mov    edx,DWORD PTR [ecx+0x648]
  4e3ba2:	52                   	push   edx
  4e3ba3:	e8 08 07 00 00       	call   0x4e42b0
  4e3ba8:	c7 05 8c 46 a1 00 01 	mov    DWORD PTR ds:0xa1468c,0x1
  4e3baf:	00 00 00 
  4e3bb2:	83 c4 28             	add    esp,0x28
  4e3bb5:	c3                   	ret
  4e3bb6:	cc                   	int3
  4e3bb7:	cc                   	int3
  4e3bb8:	cc                   	int3
  4e3bb9:	cc                   	int3
  4e3bba:	cc                   	int3
  4e3bbb:	cc                   	int3
  4e3bbc:	cc                   	int3
  4e3bbd:	cc                   	int3
  4e3bbe:	cc                   	int3
  4e3bbf:	cc                   	int3
  4e3bc0:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  4e3bc4:	81 ec 4c 01 00 00    	sub    esp,0x14c
  4e3bca:	a3 a4 f2 a0 00       	mov    ds:0xa0f2a4,eax
  4e3bcf:	53                   	push   ebx
  4e3bd0:	8b 8c 24 5c 01 00 00 	mov    ecx,DWORD PTR [esp+0x15c]
  4e3bd7:	56                   	push   esi
  4e3bd8:	8b 94 24 64 01 00 00 	mov    edx,DWORD PTR [esp+0x164]
  4e3bdf:	57                   	push   edi
  4e3be0:	55                   	push   ebp
  4e3be1:	33 f6                	xor    esi,esi
  4e3be3:	89 0d a0 f2 a0 00    	mov    DWORD PTR ds:0xa0f2a0,ecx
  4e3be9:	89 15 18 a7 a1 00    	mov    DWORD PTR ds:0xa1a718,edx
  4e3bef:	d9 84 24 6c 01 00 00 	fld    DWORD PTR [esp+0x16c]
  4e3bf6:	89 35 88 48 5d 00    	mov    DWORD PTR ds:0x5d4888,esi
  4e3bfc:	89 35 8c 48 5d 00    	mov    DWORD PTR ds:0x5d488c,esi
  4e3c02:	89 35 90 48 5d 00    	mov    DWORD PTR ds:0x5d4890,esi
  4e3c08:	e8 47 80 07 00       	call   0x55bc54
  4e3c0d:	85 c0                	test   eax,eax
  4e3c0f:	0f 84 8d 06 00 00    	je     0x4e42a2
  4e3c15:	bb 1e 00 00 00       	mov    ebx,0x1e
  4e3c1a:	8d 0c 45 00 00 00 00 	lea    ecx,[eax*2+0x0]
  4e3c21:	85 c9                	test   ecx,ecx
  4e3c23:	7c 07                	jl     0x4e3c2c
  4e3c25:	4b                   	dec    ebx
  4e3c26:	03 c9                	add    ecx,ecx
  4e3c28:	85 c9                	test   ecx,ecx
  4e3c2a:	7d f9                	jge    0x4e3c25
  4e3c2c:	8d 4b 01             	lea    ecx,[ebx+0x1]
  4e3c2f:	83 f9 09             	cmp    ecx,0x9
  4e3c32:	0f 8d 6a 06 00 00    	jge    0x4e42a2
  4e3c38:	8d 34 9d 00 00 00 00 	lea    esi,[ebx*4+0x0]
  4e3c3f:	8a cb                	mov    cl,bl
  4e3c41:	ba ff ff ff ff       	mov    edx,0xffffffff
  4e3c46:	d3 e2                	shl    edx,cl
  4e3c48:	03 d0                	add    edx,eax
  4e3c4a:	b8 01 00 00 00       	mov    eax,0x1
  4e3c4f:	d3 e0                	shl    eax,cl
  4e3c51:	89 54 24 5c          	mov    DWORD PTR [esp+0x5c],edx
  4e3c55:	db 44 24 5c          	fild   DWORD PTR [esp+0x5c]
  4e3c59:	89 44 24 5c          	mov    DWORD PTR [esp+0x5c],eax
  4e3c5d:	da 74 24 5c          	fidiv  DWORD PTR [esp+0x5c]
  4e3c61:	d9 86 9c 48 5d 00    	fld    DWORD PTR [esi+0x5d489c]
  4e3c67:	d8 a6 98 48 5d 00    	fsub   DWORD PTR [esi+0x5d4898]
  4e3c6d:	de c9                	fmulp  st(1),st
  4e3c6f:	d8 86 98 48 5d 00    	fadd   DWORD PTR [esi+0x5d4898]
  4e3c75:	d9 54 24 5c          	fst    DWORD PTR [esp+0x5c]
  4e3c79:	d8 3d b0 f7 58 00    	fdivr  DWORD PTR ds:0x58f7b0
  4e3c7f:	d8 0d 18 f8 58 00    	fmul   DWORD PTR ds:0x58f818
  4e3c85:	d9 5c 24 40          	fstp   DWORD PTR [esp+0x40]
  4e3c89:	d9 05 b0 f7 58 00    	fld    DWORD PTR ds:0x58f7b0
  4e3c8f:	d8 0d 18 f8 58 00    	fmul   DWORD PTR ds:0x58f818
  4e3c95:	d8 bc 24 78 01 00 00 	fdivr  DWORD PTR [esp+0x178]
  4e3c9c:	d8 4c 24 40          	fmul   DWORD PTR [esp+0x40]
  4e3ca0:	e8 af 7f 07 00       	call   0x55bc54
  4e3ca5:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  4e3ca9:	83 f8 20             	cmp    eax,0x20
  4e3cac:	7e 08                	jle    0x4e3cb6
  4e3cae:	c7 44 24 20 20 00 00 	mov    DWORD PTR [esp+0x20],0x20
  4e3cb5:	00 
  4e3cb6:	83 3d 84 48 5d 00 00 	cmp    DWORD PTR ds:0x5d4884,0x0
  4e3cbd:	0f 84 91 00 00 00    	je     0x4e3d54
  4e3cc3:	d9 44 24 5c          	fld    DWORD PTR [esp+0x5c]
  4e3cc7:	d8 0d 1c f8 58 00    	fmul   DWORD PTR ds:0x58f81c
  4e3ccd:	d9 fe                	fsin
  4e3ccf:	53                   	push   ebx
  4e3cd0:	83 ec 08             	sub    esp,0x8
  4e3cd3:	d8 74 24 68          	fdiv   DWORD PTR [esp+0x68]
  4e3cd7:	68 c0 48 5d 00       	push   0x5d48c0
  4e3cdc:	8d 44 24 6c          	lea    eax,[esp+0x6c]
  4e3ce0:	50                   	push   eax
  4e3ce1:	d8 0d 20 f8 58 00    	fmul   DWORD PTR ds:0x58f820
  4e3ce7:	d8 05 e4 f7 58 00    	fadd   DWORD PTR ds:0x58f7e4
  4e3ced:	d8 0d b0 f7 58 00    	fmul   DWORD PTR ds:0x58f7b0
  4e3cf3:	d8 8c 24 80 01 00 00 	fmul   DWORD PTR [esp+0x180]
  4e3cfa:	d8 8c 24 80 01 00 00 	fmul   DWORD PTR [esp+0x180]
  4e3d01:	dd 5c 24 08          	fstp   QWORD PTR [esp+0x8]
  4e3d05:	e8 46 77 07 00       	call   0x55b450
  4e3d0a:	83 c4 14             	add    esp,0x14
  4e3d0d:	b8 ff 00 00 00       	mov    eax,0xff
  4e3d12:	88 44 24 12          	mov    BYTE PTR [esp+0x12],al
  4e3d16:	50                   	push   eax
  4e3d17:	88 44 24 15          	mov    BYTE PTR [esp+0x15],al
  4e3d1b:	50                   	push   eax
  4e3d1c:	88 44 24 18          	mov    BYTE PTR [esp+0x18],al
  4e3d20:	50                   	push   eax
  4e3d21:	88 44 24 1f          	mov    BYTE PTR [esp+0x1f],al
  4e3d25:	68 28 55 d0 00       	push   0xd05528
  4e3d2a:	e8 31 29 04 00       	call   0x526660
  4e3d2f:	8d 54 24 6c          	lea    edx,[esp+0x6c]
  4e3d33:	88 44 24 24          	mov    BYTE PTR [esp+0x24],al
  4e3d37:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  4e3d3b:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  4e3d3f:	83 c4 10             	add    esp,0x10
  4e3d42:	50                   	push   eax
  4e3d43:	51                   	push   ecx
  4e3d44:	52                   	push   edx
  4e3d45:	68 2c 01 00 00       	push   0x12c
  4e3d4a:	6a 00                	push   0x0
  4e3d4c:	e8 5f 41 04 00       	call   0x527eb0
  4e3d51:	83 c4 14             	add    esp,0x14
  4e3d54:	d9 05 b0 f7 58 00    	fld    DWORD PTR ds:0x58f7b0
  4e3d5a:	d8 0d 1c f8 58 00    	fmul   DWORD PTR ds:0x58f81c
  4e3d60:	8b 15 88 48 5d 00    	mov    edx,DWORD PTR ds:0x5d4888
  4e3d66:	be 01 00 00 00       	mov    esi,0x1
  4e3d6b:	6a 00                	push   0x0
  4e3d6d:	89 15 e8 45 a1 00    	mov    DWORD PTR ds:0xa145e8,edx
  4e3d73:	da 74 24 24          	fidiv  DWORD PTR [esp+0x24]
  4e3d77:	68 00 00 80 3f       	push   0x3f800000
  4e3d7c:	89 35 98 a6 a1 00    	mov    DWORD PTR ds:0xa1a698,esi
  4e3d82:	6a 00                	push   0x0
  4e3d84:	83 ec 04             	sub    esp,0x4
  4e3d87:	d9 5c 24 64          	fstp   DWORD PTR [esp+0x64]
  4e3d8b:	d9 84 24 80 01 00 00 	fld    DWORD PTR [esp+0x180]
  4e3d92:	d8 05 e0 f7 58 00    	fadd   DWORD PTR ds:0x58f7e0
  4e3d98:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  4e3d9c:	8b 84 24 80 01 00 00 	mov    eax,DWORD PTR [esp+0x180]
  4e3da3:	8b 94 24 74 01 00 00 	mov    edx,DWORD PTR [esp+0x174]
  4e3daa:	50                   	push   eax
  4e3dab:	d8 3d e4 f7 58 00    	fdivr  DWORD PTR ds:0x58f7e4
  4e3db1:	89 4c 24 30          	mov    DWORD PTR [esp+0x30],ecx
  4e3db5:	8b 8c 24 7c 01 00 00 	mov    ecx,DWORD PTR [esp+0x17c]
  4e3dbc:	51                   	push   ecx
  4e3dbd:	52                   	push   edx
  4e3dbe:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  4e3dc2:	e8 f9 f8 ff ff       	call   0x4e36c0
  4e3dc7:	c7 44 24 60 00 00 00 	mov    DWORD PTR [esp+0x60],0x0
  4e3dce:	00 
  4e3dcf:	89 74 24 74          	mov    DWORD PTR [esp+0x74],esi
  4e3dd3:	83 c4 1c             	add    esp,0x1c
  4e3dd6:	39 74 24 20          	cmp    DWORD PTR [esp+0x20],esi
  4e3dda:	0f 8e d8 02 00 00    	jle    0x4e40b8
  4e3de0:	c7 44 24 2c a8 f4 a0 	mov    DWORD PTR [esp+0x2c],0xa0f4a8
  4e3de7:	00 
  4e3de8:	be 04 00 00 00       	mov    esi,0x4
  4e3ded:	d9 44 24 1c          	fld    DWORD PTR [esp+0x1c]
  4e3df1:	d9 fe                	fsin
  4e3df3:	d9 54 24 10          	fst    DWORD PTR [esp+0x10]
  4e3df7:	d8 8c 24 6c 01 00 00 	fmul   DWORD PTR [esp+0x16c]
  4e3dfe:	d9 54 24 18          	fst    DWORD PTR [esp+0x18]
  4e3e02:	d8 64 24 44          	fsub   DWORD PTR [esp+0x44]
  4e3e06:	d8 7c 24 18          	fdivr  DWORD PTR [esp+0x18]
  4e3e0a:	d8 0d b0 f7 58 00    	fmul   DWORD PTR ds:0x58f7b0
  4e3e10:	d8 0d 18 f8 58 00    	fmul   DWORD PTR ds:0x58f818
  4e3e16:	e8 39 7e 07 00       	call   0x55bc54
  4e3e1b:	3d 80 00 00 00       	cmp    eax,0x80
  4e3e20:	7e 05                	jle    0x4e3e27
  4e3e22:	b8 80 00 00 00       	mov    eax,0x80
  4e3e27:	d9 05 b0 f7 58 00    	fld    DWORD PTR ds:0x58f7b0
  4e3e2d:	89 44 24 5c          	mov    DWORD PTR [esp+0x5c],eax
  4e3e31:	da 74 24 5c          	fidiv  DWORD PTR [esp+0x5c]
  4e3e35:	d8 0d 18 f8 58 00    	fmul   DWORD PTR ds:0x58f818
  4e3e3b:	33 db                	xor    ebx,ebx
  4e3e3d:	33 ff                	xor    edi,edi
  4e3e3f:	d9 5c 24 24          	fstp   DWORD PTR [esp+0x24]
  4e3e43:	d9 84 24 74 01 00 00 	fld    DWORD PTR [esp+0x174]
  4e3e4a:	d8 4c 24 10          	fmul   DWORD PTR [esp+0x10]
  4e3e4e:	8b                   	.byte 0x8b
  4e3e4f:	4c                   	dec    esp
