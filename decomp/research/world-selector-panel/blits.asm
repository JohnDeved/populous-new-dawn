
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00429070 <.text+0x28070>:
  429070:	c7 05 94 c2 59 00 00 	mov    DWORD PTR ds:0x59c294,0x0
  429077:	00 00 00 
  42907a:	b9 38 ca 65 00       	mov    ecx,0x65ca38
  42907f:	e9 0c 78 03 00       	jmp    0x460890
  429084:	cc                   	int3
  429085:	cc                   	int3
  429086:	cc                   	int3
  429087:	cc                   	int3
  429088:	cc                   	int3
  429089:	cc                   	int3
  42908a:	cc                   	int3
  42908b:	cc                   	int3
  42908c:	cc                   	int3
  42908d:	cc                   	int3
  42908e:	cc                   	int3
  42908f:	cc                   	int3
  429090:	a1 50 f1 58 00       	mov    eax,ds:0x58f150
  429095:	a3 c0 ad 65 00       	mov    ds:0x65adc0,eax
  42909a:	c3                   	ret
  42909b:	cc                   	int3
  42909c:	cc                   	int3
  42909d:	cc                   	int3
  42909e:	cc                   	int3
  42909f:	cc                   	int3
  4290a0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4290a4:	a3 c0 ad 65 00       	mov    ds:0x65adc0,eax
  4290a9:	c3                   	ret
  4290aa:	cc                   	int3
  4290ab:	cc                   	int3
  4290ac:	cc                   	int3
  4290ad:	cc                   	int3
  4290ae:	cc                   	int3
  4290af:	cc                   	int3
  4290b0:	8b 54 24 04          	mov    edx,DWORD PTR [esp+0x4]
  4290b4:	83 ec 24             	sub    esp,0x24
  4290b7:	a1 94 c2 59 00       	mov    eax,ds:0x59c294
  4290bc:	56                   	push   esi
  4290bd:	c1 e0 02             	shl    eax,0x2
  4290c0:	8b 35 c0 ad 65 00    	mov    esi,DWORD PTR ds:0x65adc0
  4290c6:	89 94 80 c8 b5 65 00 	mov    DWORD PTR [eax+eax*4+0x65b5c8],edx
  4290cd:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4290d0:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  4290d4:	89 81 cc b5 65 00    	mov    DWORD PTR [ecx+0x65b5cc],eax
  4290da:	8b 44 24 3c          	mov    eax,DWORD PTR [esp+0x3c]
  4290de:	33 d2                	xor    edx,edx
  4290e0:	89 b1 d0 b5 65 00    	mov    DWORD PTR [ecx+0x65b5d0],esi
  4290e6:	8b 74 24 38          	mov    esi,DWORD PTR [esp+0x38]
  4290ea:	89 b1 d4 b5 65 00    	mov    DWORD PTR [ecx+0x65b5d4],esi
  4290f0:	89 81 d8 b5 65 00    	mov    DWORD PTR [ecx+0x65b5d8],eax
  4290f6:	8b 4c 24 34          	mov    ecx,DWORD PTR [esp+0x34]
  4290fa:	85 c9                	test   ecx,ecx
  4290fc:	74 3c                	je     0x42913a
  4290fe:	c7 44 24 04 a0 f1 58 	mov    DWORD PTR [esp+0x4],0x58f1a0
  429105:	00 
  429106:	33 c0                	xor    eax,eax
  429108:	89 54 24 20          	mov    DWORD PTR [esp+0x20],edx
  42910c:	66 8b 41 04          	mov    ax,WORD PTR [ecx+0x4]
  429110:	89 54 24 24          	mov    DWORD PTR [esp+0x24],edx
  429114:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  429118:	89 54 24 18          	mov    DWORD PTR [esp+0x18],edx
  42911c:	33 c0                	xor    eax,eax
  42911e:	89 4c 24 1c          	mov    DWORD PTR [esp+0x1c],ecx
  429122:	66 8b 41 06          	mov    ax,WORD PTR [ecx+0x6]
  429126:	8d 4c 24 04          	lea    ecx,[esp+0x4]
  42912a:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  42912e:	51                   	push   ecx
  42912f:	56                   	push   esi
  429130:	b9 38 ca 65 00       	mov    ecx,0x65ca38
  429135:	e8 66 77 03 00       	call   0x4608a0
  42913a:	5e                   	pop    esi
  42913b:	ff 05 94 c2 59 00    	inc    DWORD PTR ds:0x59c294
  429141:	83 c4 24             	add    esp,0x24
  429144:	c3                   	ret
  429145:	cc                   	int3
  429146:	cc                   	int3
  429147:	cc                   	int3
  429148:	cc                   	int3
  429149:	cc                   	int3
  42914a:	cc                   	int3
  42914b:	cc                   	int3
  42914c:	cc                   	int3
  42914d:	cc                   	int3
  42914e:	cc                   	int3
  42914f:	cc                   	int3
  429150:	b8 24 00 00 00       	mov    eax,0x24
  429155:	c3                   	ret
  429156:	cc                   	int3
  429157:	cc                   	int3
  429158:	cc                   	int3
  429159:	cc                   	int3
  42915a:	cc                   	int3
  42915b:	cc                   	int3
  42915c:	cc                   	int3
  42915d:	cc                   	int3
  42915e:	cc                   	int3
  42915f:	cc                   	int3
  429160:	b9 38 ca 65 00       	mov    ecx,0x65ca38
  429165:	e9 06 78 03 00       	jmp    0x460970
  42916a:	cc                   	int3
  42916b:	cc                   	int3
  42916c:	cc                   	int3
  42916d:	cc                   	int3
  42916e:	cc                   	int3
  42916f:	cc                   	int3
  429170:	83 ec 08             	sub    esp,0x8
  429173:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  429178:	53                   	push   ebx
  429179:	8b 80 48 06 00 00    	mov    eax,DWORD PTR [eax+0x648]
  42917f:	56                   	push   esi
  429180:	57                   	push   edi
  429181:	6a 01                	push   0x1
  429183:	8b 18                	mov    ebx,DWORD PTR [eax]
  429185:	6a 1b                	push   0x1b
  429187:	50                   	push   eax
  429188:	ff 53 5c             	call   DWORD PTR [ebx+0x5c]
  42918b:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  429191:	6a 01                	push   0x1
  429193:	6a 09                	push   0x9
  429195:	33 f6                	xor    esi,esi
  429197:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  42919d:	50                   	push   eax
  42919e:	8b 18                	mov    ebx,DWORD PTR [eax]
  4291a0:	ff 53 5c             	call   DWORD PTR [ebx+0x5c]
  4291a3:	33 db                	xor    ebx,ebx
  4291a5:	39 1d 94 c2 59 00    	cmp    DWORD PTR ds:0x59c294,ebx
  4291ab:	0f 8e 93 01 00 00    	jle    0x429344
  4291b1:	bf c8 b5 65 00       	mov    edi,0x65b5c8
  4291b6:	8b 47 0c             	mov    eax,DWORD PTR [edi+0xc]
  4291b9:	b9 38 ca 65 00       	mov    ecx,0x65ca38
  4291be:	50                   	push   eax
  4291bf:	e8 3c 83 03 00       	call   0x461500
  4291c4:	85 c0                	test   eax,eax
  4291c6:	0f 84 68 01 00 00    	je     0x429334
  4291cc:	db 07                	fild   DWORD PTR [edi]
  4291ce:	d9 15 f8 c2 59 00    	fst    DWORD PTR ds:0x59c2f8
  4291d4:	d9 1d 98 c2 59 00    	fstp   DWORD PTR ds:0x59c298
  4291da:	8b 50 1c             	mov    edx,DWORD PTR [eax+0x1c]
  4291dd:	03 17                	add    edx,DWORD PTR [edi]
  4291df:	89 54 24 0c          	mov    DWORD PTR [esp+0xc],edx
  4291e3:	89 5c 24 10          	mov    DWORD PTR [esp+0x10],ebx
  4291e7:	df 6c 24 0c          	fild   QWORD PTR [esp+0xc]
  4291eb:	d9 15 d8 c2 59 00    	fst    DWORD PTR ds:0x59c2d8
  4291f1:	d9 1d b8 c2 59 00    	fstp   DWORD PTR ds:0x59c2b8
  4291f7:	db 47 04             	fild   DWORD PTR [edi+0x4]
  4291fa:	d9 15 bc c2 59 00    	fst    DWORD PTR ds:0x59c2bc
  429200:	d9 1d 9c c2 59 00    	fstp   DWORD PTR ds:0x59c29c
  429206:	8b 50 20             	mov    edx,DWORD PTR [eax+0x20]
  429209:	03 57 04             	add    edx,DWORD PTR [edi+0x4]
  42920c:	89 54 24 0c          	mov    DWORD PTR [esp+0xc],edx
  429210:	8b 57 10             	mov    edx,DWORD PTR [edi+0x10]
  429213:	89 5c 24 10          	mov    DWORD PTR [esp+0x10],ebx
  429217:	89 15 08 c3 59 00    	mov    DWORD PTR ds:0x59c308,edx
  42921d:	df 6c 24 0c          	fild   QWORD PTR [esp+0xc]
  429221:	89 15 e8 c2 59 00    	mov    DWORD PTR ds:0x59c2e8,edx
  429227:	89 15 c8 c2 59 00    	mov    DWORD PTR ds:0x59c2c8,edx
  42922d:	89 15 a8 c2 59 00    	mov    DWORD PTR ds:0x59c2a8,edx
  429233:	8b 15 f4 c2 af 00    	mov    edx,DWORD PTR ds:0xafc2f4
  429239:	d9 15 fc c2 59 00    	fst    DWORD PTR ds:0x59c2fc
  42923f:	d9 1d dc c2 59 00    	fstp   DWORD PTR ds:0x59c2dc
  429245:	d9 47 08             	fld    DWORD PTR [edi+0x8]
  429248:	d9 15 00 c3 59 00    	fst    DWORD PTR ds:0x59c300
  42924e:	d9 1d e0 c2 59 00    	fstp   DWORD PTR ds:0x59c2e0
  429254:	8b 0d 00 c3 59 00    	mov    ecx,DWORD PTR ds:0x59c300
  42925a:	89 0d c0 c2 59 00    	mov    DWORD PTR ds:0x59c2c0,ecx
  429260:	89 0d a0 c2 59 00    	mov    DWORD PTR ds:0x59c2a0,ecx
  429266:	8b 08                	mov    ecx,DWORD PTR [eax]
  429268:	83 c1 10             	add    ecx,0x10
  42926b:	d9 01                	fld    DWORD PTR [ecx]
  42926d:	d8 0d 28 d3 5d 00    	fmul   DWORD PTR ds:0x5dd328
  429273:	d9 01                	fld    DWORD PTR [ecx]
  429275:	d8 0d 30 d3 5d 00    	fmul   DWORD PTR ds:0x5dd330
  42927b:	d9 40 08             	fld    DWORD PTR [eax+0x8]
  42927e:	d8 c2                	fadd   st,st(2)
  429280:	d9 40 0c             	fld    DWORD PTR [eax+0xc]
  429283:	d8 40 04             	fadd   DWORD PTR [eax+0x4]
  429286:	d8 c2                	fadd   st,st(2)
  429288:	d9 40 10             	fld    DWORD PTR [eax+0x10]
  42928b:	d8 40 08             	fadd   DWORD PTR [eax+0x8]
  42928e:	d8 c3                	fadd   st,st(3)
  429290:	d9 cc                	fxch   st(4)
  429292:	d8 40 04             	fadd   DWORD PTR [eax+0x4]
  429295:	d9 15 10 c3 59 00    	fst    DWORD PTR ds:0x59c310
  42929b:	d9 1d b0 c2 59 00    	fstp   DWORD PTR ds:0x59c2b0
  4292a1:	d9 15 f0 c2 59 00    	fst    DWORD PTR ds:0x59c2f0
  4292a7:	d9 1d d0 c2 59 00    	fstp   DWORD PTR ds:0x59c2d0
  4292ad:	d9 15 d4 c2 59 00    	fst    DWORD PTR ds:0x59c2d4
  4292b3:	d9 1d b4 c2 59 00    	fstp   DWORD PTR ds:0x59c2b4
  4292b9:	d9 c1                	fld    st(1)
  4292bb:	d9 1d 14 c3 59 00    	fstp   DWORD PTR ds:0x59c314
  4292c1:	d9 c9                	fxch   st(1)
  4292c3:	d9 1d f4 c2 59 00    	fstp   DWORD PTR ds:0x59c2f4
  4292c9:	dd d8                	fstp   st(0)
  4292cb:	8b 8a 48 06 00 00    	mov    ecx,DWORD PTR [edx+0x648]
  4292d1:	8b 00                	mov    eax,DWORD PTR [eax]
  4292d3:	8b 50 0c             	mov    edx,DWORD PTR [eax+0xc]
  4292d6:	8b 42 40             	mov    eax,DWORD PTR [edx+0x40]
  4292d9:	50                   	push   eax
  4292da:	6a 01                	push   0x1
  4292dc:	51                   	push   ecx
  4292dd:	8b 01                	mov    eax,DWORD PTR [ecx]
  4292df:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  4292e2:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4292e8:	6a 01                	push   0x1
  4292ea:	6a 11                	push   0x11
  4292ec:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  4292f2:	50                   	push   eax
  4292f3:	8b 00                	mov    eax,DWORD PTR [eax]
  4292f5:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  4292f8:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4292fe:	6a 01                	push   0x1
  429300:	6a 12                	push   0x12
  429302:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  429308:	50                   	push   eax
  429309:	8b 00                	mov    eax,DWORD PTR [eax]
  42930b:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  42930e:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  429314:	6a 08                	push   0x8
  429316:	6a 06                	push   0x6
  429318:	68 18 c3 59 00       	push   0x59c318
  42931d:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  429323:	6a 04                	push   0x4
  429325:	68 98 c2 59 00       	push   0x59c298
  42932a:	6a 03                	push   0x3
  42932c:	6a 04                	push   0x4
  42932e:	50                   	push   eax
  42932f:	8b 00                	mov    eax,DWORD PTR [eax]
  429331:	ff 50 78             	call   DWORD PTR [eax+0x78]
  429334:	83 c7 14             	add    edi,0x14
  429337:	46                   	inc    esi
  429338:	3b 35 94 c2 59 00    	cmp    esi,DWORD PTR ds:0x59c294
  42933e:	0f 8c 72 fe ff ff    	jl     0x4291b6
  429344:	5f                   	pop    edi
  429345:	5e                   	pop    esi
  429346:	5b                   	pop    ebx
  429347:	83 c4 08             	add    esp,0x8
  42934a:	c3                   	ret
  42934b:	cc                   	int3
  42934c:	cc                   	int3
  42934d:	cc                   	int3
  42934e:	cc                   	int3
  42934f:	cc                   	int3
  429350:	83 ec 04             	sub    esp,0x4
  429353:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  429358:	56                   	push   esi
  429359:	8b 80 48 06 00 00    	mov    eax,DWORD PTR [eax+0x648]
  42935f:	c7 44 24 04 00 00 80 	mov    DWORD PTR [esp+0x4],0x3e800000
  429366:	3e 
  429367:	6a 01                	push   0x1
  429369:	8b 30                	mov    esi,DWORD PTR [eax]
  42936b:	6a 03                	push   0x3
  42936d:	50                   	push   eax
  42936e:	ff 56 5c             	call   DWORD PTR [esi+0x5c]
  429371:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  429377:	6a 00                	push   0x0
  429379:	6a 05                	push   0x5
  42937b:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  429381:	50                   	push   eax
  429382:	8b 30                	mov    esi,DWORD PTR [eax]
  429384:	ff 56 5c             	call   DWORD PTR [esi+0x5c]
  429387:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  42938d:	6a 00                	push   0x0
  42938f:	6a 06                	push   0x6
  429391:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  429397:	50                   	push   eax
  429398:	8b 30                	mov    esi,DWORD PTR [eax]
  42939a:	ff 56 5c             	call   DWORD PTR [esi+0x5c]
  42939d:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4293a3:	6a 00                	push   0x0
  4293a5:	6a 1b                	push   0x1b
  4293a7:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  4293ad:	50                   	push   eax
  4293ae:	8b 30                	mov    esi,DWORD PTR [eax]
  4293b0:	ff 56 5c             	call   DWORD PTR [esi+0x5c]
  4293b3:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4293b9:	6a 01                	push   0x1
  4293bb:	6a 16                	push   0x16
  4293bd:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  4293c3:	50                   	push   eax
  4293c4:	8b 30                	mov    esi,DWORD PTR [eax]
  4293c6:	ff 56 5c             	call   DWORD PTR [esi+0x5c]
  4293c9:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4293cf:	6a 00                	push   0x0
  4293d1:	6a 01                	push   0x1
  4293d3:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  4293d9:	50                   	push   eax
  4293da:	8b 30                	mov    esi,DWORD PTR [eax]
  4293dc:	ff 56 5c             	call   DWORD PTR [esi+0x5c]
  4293df:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  4293e3:	85 f6                	test   esi,esi
  4293e5:	74 1e                	je     0x429405
  4293e7:	6a 00                	push   0x0
  4293e9:	e8 12 a1 0b 00       	call   0x4e3500
  4293ee:	83 c4 04             	add    esp,0x4
  4293f1:	8d 0c f5 00 00 00 00 	lea    ecx,[esi*8+0x0]
  4293f8:	2b ce                	sub    ecx,esi
  4293fa:	c1 e1 04             	shl    ecx,0x4
  4293fd:	03 0d fc c1 59 00    	add    ecx,DWORD PTR ds:0x59c1fc
  429403:	eb 21                	jmp    0x429426
  429405:	6a 01                	push   0x1
  429407:	e8 f4 a0 0b 00       	call   0x4e3500
  42940c:	83 c4 04             	add    esp,0x4
  42940f:	33 c0                	xor    eax,eax
  429411:	b9 d8 92 67 00       	mov    ecx,0x6792d8
  429416:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  42941a:	c7 44 24 04 00 00 00 	mov    DWORD PTR [esp+0x4],0x3f000000
  429421:	3f 
  429422:	89 44 24 24          	mov    DWORD PTR [esp+0x24],eax
  429426:	e8 f5 03 0e 00       	call   0x509820
  42942b:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  42942f:	8b 4c 24 28          	mov    ecx,DWORD PTR [esp+0x28]
  429433:	8b 54 24 24          	mov    edx,DWORD PTR [esp+0x24]
  429437:	50                   	push   eax
  429438:	51                   	push   ecx
  429439:	52                   	push   edx
  42943a:	e8 51 a1 0b 00       	call   0x4e3590
  42943f:	83 c4 0c             	add    esp,0xc
  429442:	6a 00                	push   0x0
  429444:	e8 67 a1 0b 00       	call   0x4e35b0
  429449:	8b 4c 24 24          	mov    ecx,DWORD PTR [esp+0x24]
  42944d:	8b 54 24 20          	mov    edx,DWORD PTR [esp+0x20]
  429451:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  429455:	83 c4 04             	add    esp,0x4
  429458:	68 9a 99 99 3f       	push   0x3f99999a
  42945d:	51                   	push   ecx
  42945e:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  429462:	52                   	push   edx
  429463:	8b 54 24 1c          	mov    edx,DWORD PTR [esp+0x1c]
  429467:	50                   	push   eax
  429468:	51                   	push   ecx
  429469:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  42946e:	52                   	push   edx
  42946f:	8b 88 48 06 00 00    	mov    ecx,DWORD PTR [eax+0x648]
  429475:	51                   	push   ecx
  429476:	e8 45 a7 0b 00       	call   0x4e3bc0
  42947b:	83 c4 1c             	add    esp,0x1c
  42947e:	5e                   	pop    esi
  42947f:	83 c4 04             	add    esp,0x4
  429482:	c3                   	ret
  429483:	cc                   	int3
  429484:	cc                   	int3
  429485:	cc                   	int3
  429486:	cc                   	int3
  429487:	cc                   	int3
  429488:	cc                   	int3
  429489:	cc                   	int3
  42948a:	cc                   	int3
  42948b:	cc                   	int3
  42948c:	cc                   	int3
  42948d:	cc                   	int3
  42948e:	cc                   	int3
  42948f:	cc                   	int3
  429490:	83 ec 2c             	sub    esp,0x2c
  429493:	53                   	push   ebx
  429494:	56                   	push   esi
  429495:	83 39 00             	cmp    DWORD PTR [ecx],0x0
  429498:	57                   	push   edi
  429499:	55                   	push   ebp
  42949a:	8b d9                	mov    ebx,ecx
  42949c:	0f 85 0f 01 00 00    	jne    0x4295b1
  4294a2:	8b 74 24 40          	mov    esi,DWORD PTR [esp+0x40]
  4294a6:	8b 46 10             	mov    eax,DWORD PTR [esi+0x10]
  4294a9:	c1 e0 02             	shl    eax,0x2
  4294ac:	50                   	push   eax
  4294ad:	e8 ee 17 13 00       	call   0x55aca0
  4294b2:	83 c4 04             	add    esp,0x4
  4294b5:	8b f8                	mov    edi,eax
  4294b7:	89 03                	mov    DWORD PTR [ebx],eax
  4294b9:	33 c0                	xor    eax,eax
  4294bb:	8b 4e 10             	mov    ecx,DWORD PTR [esi+0x10]
  4294be:	c1 e1 02             	shl    ecx,0x2
  4294c1:	c1 e9 02             	shr    ecx,0x2
  4294c4:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4294c6:	8b 46 10             	mov    eax,DWORD PTR [esi+0x10]
  4294c9:	c1 e0 02             	shl    eax,0x2
  4294cc:	50                   	push   eax
  4294cd:	e8 ce 17 13 00       	call   0x55aca0
  4294d2:	83 c4 04             	add    esp,0x4
  4294d5:	8b f8                	mov    edi,eax
  4294d7:	89 43 04             	mov    DWORD PTR [ebx+0x4],eax
  4294da:	33 c0                	xor    eax,eax
  4294dc:	8b 4e 10             	mov    ecx,DWORD PTR [esi+0x10]
  4294df:	c1 e1 02             	shl    ecx,0x2
  4294e2:	c1 e9 02             	shr    ecx,0x2
  4294e5:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4294e7:	39 44 24 44          	cmp    DWORD PTR [esp+0x44],eax
  4294eb:	74 0b                	je     0x4294f8
  4294ed:	8b 0d 24 c3 59 00    	mov    ecx,DWORD PTR ds:0x59c324
  4294f3:	e8 98 73 03 00       	call   0x460890
  4294f8:	c7 44 24 14 00 00 00 	mov    DWORD PTR [esp+0x14],0x0
  4294ff:	00 
  429500:	83 7e 10 00          	cmp    DWORD PTR [esi+0x10],0x0
  429504:	0f 86 91 00 00 00    	jbe    0x42959b
  42950a:	33 ff                	xor    edi,edi
  42950c:	89 7c 24 10          	mov    DWORD PTR [esp+0x10],edi
  429510:	8b 6e 0c             	mov    ebp,DWORD PTR [esi+0xc]
  429513:	8b 4b 04             	mov    ecx,DWORD PTR [ebx+0x4]
  429516:	03 6c 24 10          	add    ebp,DWORD PTR [esp+0x10]
  42951a:	83 7c 24 44 00       	cmp    DWORD PTR [esp+0x44],0x0
  42951f:	89 2c 39             	mov    DWORD PTR [ecx+edi*1],ebp
  429522:	74 5e                	je     0x429582
  429524:	8b 0d 24 c3 59 00    	mov    ecx,DWORD PTR ds:0x59c324
  42952a:	e8 51 73 03 00       	call   0x460880
  42952f:	8b 0b                	mov    ecx,DWORD PTR [ebx]
  429531:	89 04 39             	mov    DWORD PTR [ecx+edi*1],eax
  429534:	33 c0                	xor    eax,eax
  429536:	8d 4c 24 18          	lea    ecx,[esp+0x18]
  42953a:	8b 13                	mov    edx,DWORD PTR [ebx]
  42953c:	c7 44 24 18 a0 f1 58 	mov    DWORD PTR [esp+0x18],0x58f1a0
  429543:	00 
  429544:	66 8b 45 04          	mov    ax,WORD PTR [ebp+0x4]
  429548:	51                   	push   ecx
  429549:	8b 0d 24 c3 59 00    	mov    ecx,DWORD PTR ds:0x59c324
  42954f:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  429553:	33 c0                	xor    eax,eax
  429555:	66 8b 45 06          	mov    ax,WORD PTR [ebp+0x6]
  429559:	89 44 24 24          	mov    DWORD PTR [esp+0x24],eax
  42955d:	89 6c 24 34          	mov    DWORD PTR [esp+0x34],ebp
  429561:	c7 44 24 38 00 00 00 	mov    DWORD PTR [esp+0x38],0x0
  429568:	00 
  429569:	c7 44 24 3c 00 00 00 	mov    DWORD PTR [esp+0x3c],0x0
  429570:	00 
  429571:	c7 44 24 30 00 00 00 	mov    DWORD PTR [esp+0x30],0x0
  429578:	00 
  429579:	8b 04 3a             	mov    eax,DWORD PTR [edx+edi*1]
  42957c:	50                   	push   eax
  42957d:	e8 1e 73 03 00       	call   0x4608a0
  429582:	83 c7 04             	add    edi,0x4
  429585:	ff 44 24 14          	inc    DWORD PTR [esp+0x14]
  429589:	83 44 24 10 08       	add    DWORD PTR [esp+0x10],0x8
  42958e:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  429592:	39 46 10             	cmp    DWORD PTR [esi+0x10],eax
  429595:	0f 87 75 ff ff ff    	ja     0x429510
  42959b:	83 7c 24 44 00       	cmp    DWORD PTR [esp+0x44],0x0
  4295a0:	74 0f                	je     0x4295b1
  4295a2:	8b 0d 24 c3 59 00    	mov    ecx,DWORD PTR ds:0x59c324
  4295a8:	e8 c3 73 03 00       	call   0x460970
  4295ad:	85 c0                	test   eax,eax
  4295af:	75 02                	jne    0x4295b3
  4295b1:	33 c0                	xor    eax,eax
  4295b3:	5d                   	pop    ebp
  4295b4:	5f                   	pop    edi
  4295b5:	5e                   	pop    esi
  4295b6:	5b                   	pop    ebx
  4295b7:	83 c4 2c             	add    esp,0x2c
  4295ba:	c2 08 00             	ret    0x8
  4295bd:	cc                   	int3
  4295be:	cc                   	int3
  4295bf:	cc                   	int3
  4295c0:	83 ec 24             	sub    esp,0x24
  4295c3:	53                   	push   ebx
  4295c4:	56                   	push   esi
  4295c5:	8b 01                	mov    eax,DWORD PTR [ecx]
  4295c7:	57                   	push   edi
  4295c8:	8b f1                	mov    esi,ecx
  4295ca:	8b 7c 24 3c          	mov    edi,DWORD PTR [esp+0x3c]
  4295ce:	8d 1c b8             	lea    ebx,[eax+edi*4]
  4295d1:	83 3b 00             	cmp    DWORD PTR [ebx],0x0
  4295d4:	75 0c                	jne    0x4295e2
  4295d6:	b9 38 ca 65 00       	mov    ecx,0x65ca38
  4295db:	e8 a0 72 03 00       	call   0x460880
  4295e0:	89 03                	mov    DWORD PTR [ebx],eax
  4295e2:	8b 06                	mov    eax,DWORD PTR [esi]
  4295e4:	8b 5e 04             	mov    ebx,DWORD PTR [esi+0x4]
  4295e7:	8b 0c b8             	mov    ecx,DWORD PTR [eax+edi*4]
  4295ea:	8b 14 bb             	mov    edx,DWORD PTR [ebx+edi*4]
  4295ed:	a1 94 c2 59 00       	mov    eax,ds:0x59c294
  4295f2:	8b 5c 24 34          	mov    ebx,DWORD PTR [esp+0x34]
  4295f6:	c1 e0 02             	shl    eax,0x2
  4295f9:	8b 3d c0 ad 65 00    	mov    edi,DWORD PTR ds:0x65adc0
  4295ff:	89 9c 80 c8 b5 65 00 	mov    DWORD PTR [eax+eax*4+0x65b5c8],ebx
  429606:	8d 34 80             	lea    esi,[eax+eax*4]
  429609:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  42960d:	89 86 cc b5 65 00    	mov    DWORD PTR [esi+0x65b5cc],eax
  429613:	89 be d0 b5 65 00    	mov    DWORD PTR [esi+0x65b5d0],edi
  429619:	89 8e d4 b5 65 00    	mov    DWORD PTR [esi+0x65b5d4],ecx
  42961f:	c7 86 d8 b5 65 00 ff 	mov    DWORD PTR [esi+0x65b5d8],0xffffffff
  429626:	ff ff ff 
  429629:	33 f6                	xor    esi,esi
  42962b:	85 d2                	test   edx,edx
  42962d:	74 3c                	je     0x42966b
  42962f:	c7 44 24 0c a0 f1 58 	mov    DWORD PTR [esp+0xc],0x58f1a0
  429636:	00 
  429637:	33 c0                	xor    eax,eax
  429639:	66 8b 42 04          	mov    ax,WORD PTR [edx+0x4]
  42963d:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  429641:	33 c0                	xor    eax,eax
  429643:	66 8b 42 06          	mov    ax,WORD PTR [edx+0x6]
  429647:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  42964b:	89 74 24 28          	mov    DWORD PTR [esp+0x28],esi
  42964f:	89 74 24 2c          	mov    DWORD PTR [esp+0x2c],esi
  429653:	89 74 24 20          	mov    DWORD PTR [esp+0x20],esi
  429657:	89 54 24 24          	mov    DWORD PTR [esp+0x24],edx
  42965b:	8d 54 24 0c          	lea    edx,[esp+0xc]
  42965f:	52                   	push   edx
  429660:	51                   	push   ecx
  429661:	b9 38 ca 65 00       	mov    ecx,0x65ca38
  429666:	e8 35 72 03 00       	call   0x4608a0
  42966b:	5f                   	pop    edi
  42966c:	ff                   	.byte 0xff
  42966d:	05                   	.byte 0x5
  42966e:	94                   	xchg   esp,eax
  42966f:	c2                   	.byte 0xc2
