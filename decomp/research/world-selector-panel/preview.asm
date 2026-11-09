
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00412780 <.text+0x11780>:
  412780:	81 ec 94 01 00 00    	sub    esp,0x194
  412786:	8d 44 24 04          	lea    eax,[esp+0x4]
  41278a:	56                   	push   esi
  41278b:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  41278f:	50                   	push   eax
  412790:	8d 54 24 14          	lea    edx,[esp+0x14]
  412794:	51                   	push   ecx
  412795:	8d 84 24 a0 00 00 00 	lea    eax,[esp+0xa0]
  41279c:	52                   	push   edx
  41279d:	8b b4 24 a8 01 00 00 	mov    esi,DWORD PTR [esp+0x1a8]
  4127a4:	50                   	push   eax
  4127a5:	56                   	push   esi
  4127a6:	e8 45 2b 07 00       	call   0x4852f0
  4127ab:	83 c4 14             	add    esp,0x14
  4127ae:	85 c0                	test   eax,eax
  4127b0:	75 08                	jne    0x4127ba
  4127b2:	c7 44 24 08 01 00 00 	mov    DWORD PTR [esp+0x8],0x1
  4127b9:	00 
  4127ba:	83 7c 24 08 0a       	cmp    DWORD PTR [esp+0x8],0xa
  4127bf:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  4127c3:	7d 04                	jge    0x4127c9
  4127c5:	04 30                	add    al,0x30
  4127c7:	eb 02                	jmp    0x4127cb
  4127c9:	04 57                	add    al,0x57
  4127cb:	8d 4c 24 18          	lea    ecx,[esp+0x18]
  4127cf:	88 44 24 07          	mov    BYTE PTR [esp+0x7],al
  4127d3:	0f be 44 24 07       	movsx  eax,BYTE PTR [esp+0x7]
  4127d8:	50                   	push   eax
  4127d9:	68 8c 9b 59 00       	push   0x599b8c
  4127de:	51                   	push   ecx
  4127df:	e8 6c 8c 14 00       	call   0x55b450
  4127e4:	8d 54 24 44          	lea    edx,[esp+0x44]
  4127e8:	83 c4 0c             	add    esp,0xc
  4127eb:	0f be 4c 24 07       	movsx  ecx,BYTE PTR [esp+0x7]
  4127f0:	51                   	push   ecx
  4127f1:	68 78 9b 59 00       	push   0x599b78
  4127f6:	52                   	push   edx
  4127f7:	e8 54 8c 14 00       	call   0x55b450
  4127fc:	8d 54 24 64          	lea    edx,[esp+0x64]
  412800:	83 c4 0c             	add    esp,0xc
  412803:	0f be 4c 24 07       	movsx  ecx,BYTE PTR [esp+0x7]
  412808:	51                   	push   ecx
  412809:	68 64 9b 59 00       	push   0x599b64
  41280e:	52                   	push   edx
  41280f:	e8 3c 8c 14 00       	call   0x55b450
  412814:	8d 8c 24 84 00 00 00 	lea    ecx,[esp+0x84]
  41281b:	83 c4 0c             	add    esp,0xc
  41281e:	56                   	push   esi
  41281f:	68 50 9b 59 00       	push   0x599b50
  412824:	51                   	push   ecx
  412825:	e8 26 8c 14 00       	call   0x55b450
  41282a:	83 c4 0c             	add    esp,0xc
  41282d:	e8 ce 09 09 00       	call   0x4a3200
  412832:	e8 e9 14 09 00       	call   0x4a3d20
  412837:	8d 4c 24 18          	lea    ecx,[esp+0x18]
  41283b:	51                   	push   ecx
  41283c:	68 23 cd 89 00       	push   0x89cd23
  412841:	e8 6a d9 0e 00       	call   0x5001b0
  412846:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  41284a:	83 c4 08             	add    esp,0x8
  41284d:	8b 15 f8 ef 87 00    	mov    edx,DWORD PTR ds:0x87eff8
  412853:	51                   	push   ecx
  412854:	68 00 04 00 00       	push   0x400
  412859:	52                   	push   edx
  41285a:	68 23 cd 89 00       	push   0x89cd23
  41285f:	e8 1c 37 11 00       	call   0x525f80
  412864:	83 c4 10             	add    esp,0x10
  412867:	e8 94 09 09 00       	call   0x4a3200
  41286c:	e8 af 14 09 00       	call   0x4a3d20
  412871:	8d 4c 24 38          	lea    ecx,[esp+0x38]
  412875:	51                   	push   ecx
  412876:	68 23 cd 89 00       	push   0x89cd23
  41287b:	e8 30 d9 0e 00       	call   0x5001b0
  412880:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  412884:	83 c4 08             	add    esp,0x8
  412887:	51                   	push   ecx
  412888:	68 00 40 00 00       	push   0x4000
  41288d:	68 e0 ea 96 00       	push   0x96eae0
  412892:	68 23 cd 89 00       	push   0x89cd23
  412897:	e8 e4 36 11 00       	call   0x525f80
  41289c:	83 c4 10             	add    esp,0x10
  41289f:	e8 5c 09 09 00       	call   0x4a3200
  4128a4:	e8 77 14 09 00       	call   0x4a3d20
  4128a9:	8d 4c 24 58          	lea    ecx,[esp+0x58]
  4128ad:	51                   	push   ecx
  4128ae:	68 23 cd 89 00       	push   0x89cd23
  4128b3:	e8 f8 d8 0e 00       	call   0x5001b0
  4128b8:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  4128bc:	83 c4 08             	add    esp,0x8
  4128bf:	51                   	push   ecx
  4128c0:	68 00 60 00 00       	push   0x6000
  4128c5:	68 68 e4 5f 00       	push   0x5fe468
  4128ca:	68 23 cd 89 00       	push   0x89cd23
  4128cf:	e8 ac 36 11 00       	call   0x525f80
  4128d4:	83 c4 10             	add    esp,0x10
  4128d7:	e8 24 09 09 00       	call   0x4a3200
  4128dc:	e8 3f 14 09 00       	call   0x4a3d20
  4128e1:	8d 4c 24 78          	lea    ecx,[esp+0x78]
  4128e5:	51                   	push   ecx
  4128e6:	68 23 cd 89 00       	push   0x89cd23
  4128eb:	e8 c0 d8 0e 00       	call   0x5001b0
  4128f0:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  4128f4:	83 c4 08             	add    esp,0x8
  4128f7:	51                   	push   ecx
  4128f8:	68 00 00 04 00       	push   0x40000
  4128fd:	68 e0 cf 9b 00       	push   0x9bcfe0
  412902:	68 23 cd 89 00       	push   0x89cd23
  412907:	e8 74 36 11 00       	call   0x525f80
  41290c:	83 c4 10             	add    esp,0x10
  41290f:	83 0d f4 c9 5f 00 02 	or     DWORD PTR ds:0x5fc9f4,0x2
  412916:	5e                   	pop    esi
  412917:	81 c4 94 01 00 00    	add    esp,0x194
  41291d:	c3                   	ret
  41291e:	cc                   	int3
  41291f:	cc                   	int3
  412920:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  412924:	a3 ac 13 5f 00       	mov    ds:0x5f13ac,eax
  412929:	c3                   	ret
  41292a:	cc                   	int3
  41292b:	cc                   	int3
  41292c:	cc                   	int3
  41292d:	cc                   	int3
  41292e:	cc                   	int3
  41292f:	cc                   	int3
  412930:	33 c0                	xor    eax,eax
  412932:	39 05 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,eax
  412938:	7e 1d                	jle    0x412957
  41293a:	8b 15 bc 13 5f 00    	mov    edx,DWORD PTR ds:0x5f13bc
  412940:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  412944:	83 c2 28             	add    edx,0x28
  412947:	39 0a                	cmp    DWORD PTR [edx],ecx
  412949:	74 0e                	je     0x412959
  41294b:	83 c2 34             	add    edx,0x34
  41294e:	40                   	inc    eax
  41294f:	39 05 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,eax
  412955:	7f f0                	jg     0x412947
  412957:	33 c0                	xor    eax,eax
  412959:	c3                   	ret
  41295a:	cc                   	int3
  41295b:	cc                   	int3
  41295c:	cc                   	int3
  41295d:	cc                   	int3
  41295e:	cc                   	int3
  41295f:	cc                   	int3
