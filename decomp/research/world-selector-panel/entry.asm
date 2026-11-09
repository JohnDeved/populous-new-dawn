
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00410fd0 <.text+0xffd0>:
  410fd0:	83 ec 04             	sub    esp,0x4
  410fd3:	33 c0                	xor    eax,eax
  410fd5:	39 05 34 9a 59 00    	cmp    DWORD PTR ds:0x599a34,eax
  410fdb:	56                   	push   esi
  410fdc:	74 15                	je     0x410ff3
  410fde:	a3 34 9a 59 00       	mov    ds:0x599a34,eax
  410fe3:	a3 f4 c9 5f 00       	mov    ds:0x5fc9f4,eax
  410fe8:	ff 15 84 c7 d0 00    	call   DWORD PTR ds:0xd0c784
  410fee:	a3 f8 c9 5f 00       	mov    ds:0x5fc9f8,eax
  410ff3:	83 25 f4 c9 5f 00 fd 	and    DWORD PTR ds:0x5fc9f4,0xfffffffd
  410ffa:	83 25 f4 c9 5f 00 fb 	and    DWORD PTR ds:0x5fc9f4,0xfffffffb
  411001:	83 25 f4 c9 5f 00 f7 	and    DWORD PTR ds:0x5fc9f4,0xfffffff7
  411008:	c7 05 cc c9 5f 00 c0 	mov    DWORD PTR ds:0x5fc9cc,0x4112c0
  41100f:	12 41 00 
  411012:	c7 05 d0 c9 5f 00 00 	mov    DWORD PTR ds:0x5fc9d0,0x411500
  411019:	15 41 00 
  41101c:	c7 05 b0 c9 5f 00 80 	mov    DWORD PTR ds:0x5fc9b0,0x280
  411023:	02 00 00 
  411026:	c7 05 b4 c9 5f 00 e0 	mov    DWORD PTR ds:0x5fc9b4,0x1e0
  41102d:	01 00 00 
  411030:	c7 05 b8 c9 5f 00 00 	mov    DWORD PTR ds:0x5fc9b8,0x43a00000
  411037:	00 a0 43 
  41103a:	c7 05 bc c9 5f 00 00 	mov    DWORD PTR ds:0x5fc9bc,0x43700000
  411041:	00 70 43 
  411044:	c7 05 c0 c9 5f 00 00 	mov    DWORD PTR ds:0x5fc9c0,0x441fc000
  41104b:	c0 1f 44 
  41104e:	c7 05 c4 c9 5f 00 00 	mov    DWORD PTR ds:0x5fc9c4,0x43ef8000
  411055:	80 ef 43 
  411058:	33 f6                	xor    esi,esi
  41105a:	89 35 f0 c9 5f 00    	mov    DWORD PTR ds:0x5fc9f0,esi
  411060:	e8 bb ea 00 00       	call   0x41fb20
  411065:	39 35 38 9a 59 00    	cmp    DWORD PTR ds:0x599a38,esi
  41106b:	74 3b                	je     0x4110a8
  41106d:	33 c0                	xor    eax,eax
  41106f:	89 35 38 9a 59 00    	mov    DWORD PTR ds:0x599a38,esi
  411075:	eb 06                	jmp    0x41107d
  411077:	d9 98 a4 15 5f 00    	fstp   DWORD PTR [eax+0x5f15a4]
  41107d:	83 c0 04             	add    eax,0x4
  411080:	89 74 24 04          	mov    DWORD PTR [esp+0x4],esi
  411084:	db 44 24 04          	fild   DWORD PTR [esp+0x4]
  411088:	46                   	inc    esi
  411089:	3d 00 5a 00 00       	cmp    eax,0x5a00
  41108e:	dc 0d 20 f0 58 00    	fmul   QWORD PTR ds:0x58f020
  411094:	d9 c0                	fld    st(0)
  411096:	d9 fe                	fsin
  411098:	d9 98 a4 6f 5f 00    	fstp   DWORD PTR [eax+0x5f6fa4]
  41109e:	d9 ff                	fcos
  4110a0:	7c d5                	jl     0x411077
  4110a2:	d9 98 a4 15 5f 00    	fstp   DWORD PTR [eax+0x5f15a4]
  4110a8:	e8 d3 40 04 00       	call   0x455180
  4110ad:	e8 de 06 00 00       	call   0x411790
  4110b2:	e8 29 d3 06 00       	call   0x47e3e0
  4110b7:	8b 0d ac 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13ac
  4110bd:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  4110c2:	8d 14 49             	lea    edx,[ecx+ecx*2]
  4110c5:	8d 0c 91             	lea    ecx,[ecx+edx*4]
  4110c8:	8b 54 88 28          	mov    edx,DWORD PTR [eax+ecx*4+0x28]
  4110cc:	52                   	push   edx
  4110cd:	e8 ae 16 00 00       	call   0x412780
  4110d2:	83 c4 04             	add    esp,0x4
  4110d5:	b8 01 00 00 00       	mov    eax,0x1
  4110da:	5e                   	pop    esi
  4110db:	83 c4 04             	add    esp,0x4
  4110de:	c3                   	ret
  4110df:	cc                   	int3
  4110e0:	83 ec 08             	sub    esp,0x8
  4110e3:	f6 05 f4 c9 5f 00 08 	test   BYTE PTR ds:0x5fc9f4,0x8
  4110ea:	74 2f                	je     0x41111b
  4110ec:	8b 0d b0 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13b0
  4110f2:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  4110f7:	8d 14 49             	lea    edx,[ecx+ecx*2]
  4110fa:	8d 0c 91             	lea    ecx,[ecx+edx*4]
  4110fd:	8b 54 88 28          	mov    edx,DWORD PTR [eax+ecx*4+0x28]
  411101:	52                   	push   edx
  411102:	e8 e9 47 07 00       	call   0x4858f0
  411107:	83 c4 04             	add    esp,0x4
  41110a:	6a 02                	push   0x2
  41110c:	e8 4f 19 03 00       	call   0x442a60
  411111:	83 25 f4 c9 5f 00 f7 	and    DWORD PTR ds:0x5fc9f4,0xfffffff7
  411118:	83 c4 04             	add    esp,0x4
  41111b:	f6 05 f4 c9 5f 00 02 	test   BYTE PTR ds:0x5fc9f4,0x2
  411122:	74 5e                	je     0x411182
  411124:	a1 f8 ef 87 00       	mov    eax,ds:0x87eff8
  411129:	50                   	push   eax
  41112a:	e8 f1 22 09 00       	call   0x4a3420
  41112f:	83 c4 04             	add    esp,0x4
  411132:	e8 f9 23 09 00       	call   0x4a3530
  411137:	68 f4 c6 89 00       	push   0x89c6f4
  41113c:	a1 f8 ef 87 00       	mov    eax,ds:0x87eff8
  411141:	50                   	push   eax
  411142:	e8 79 9c 01 00       	call   0x42adc0
  411147:	83 c4 08             	add    esp,0x8
  41114a:	33 c9                	xor    ecx,ecx
  41114c:	a1 f8 ef 87 00       	mov    eax,ds:0x87eff8
  411151:	33 d2                	xor    edx,edx
  411153:	83 25 f4 c9 5f 00 fd 	and    DWORD PTR ds:0x5fc9f4,0xfffffffd
  41115a:	89 0d f0 c9 5f 00    	mov    DWORD PTR ds:0x5fc9f0,ecx
  411160:	38 10                	cmp    BYTE PTR [eax],dl
  411162:	75 0a                	jne    0x41116e
  411164:	38 50 01             	cmp    BYTE PTR [eax+0x1],dl
  411167:	75 05                	jne    0x41116e
  411169:	38 50 02             	cmp    BYTE PTR [eax+0x2],dl
  41116c:	74 0e                	je     0x41117c
  41116e:	41                   	inc    ecx
  41116f:	83 c0 04             	add    eax,0x4
  411172:	81 f9 00 01 00 00    	cmp    ecx,0x100
  411178:	7c e6                	jl     0x411160
  41117a:	eb 06                	jmp    0x411182
  41117c:	89 0d f0 c9 5f 00    	mov    DWORD PTR ds:0x5fc9f0,ecx
  411182:	f6 05 f5 c9 5f 00 01 	test   BYTE PTR ds:0x5fc9f5,0x1
  411189:	74 07                	je     0x411192
  41118b:	e8 10 bd 01 00       	call   0x42cea0
  411190:	eb 27                	jmp    0x4111b9
  411192:	6a 00                	push   0x0
  411194:	6a 00                	push   0x0
  411196:	68 cc c9 5f 00       	push   0x5fc9cc
  41119b:	e8 e0 58 11 00       	call   0x526a80
  4111a0:	83 c4 0c             	add    esp,0xc
  4111a3:	e8 28 5c 11 00       	call   0x526dd0
  4111a8:	8b 08                	mov    ecx,DWORD PTR [eax]
  4111aa:	8b 50 04             	mov    edx,DWORD PTR [eax+0x4]
  4111ad:	89 0d e0 c9 5f 00    	mov    DWORD PTR ds:0x5fc9e0,ecx
  4111b3:	89 15 e4 c9 5f 00    	mov    DWORD PTR ds:0x5fc9e4,edx
  4111b9:	ff 15 84 c7 d0 00    	call   DWORD PTR ds:0xd0c784
  4111bf:	8b c8                	mov    ecx,eax
  4111c1:	2b 0d f8 c9 5f 00    	sub    ecx,DWORD PTR ds:0x5fc9f8
  4111c7:	81 f9 e8 03 00 00    	cmp    ecx,0x3e8
  4111cd:	76 05                	jbe    0x4111d4
  4111cf:	b9 e8 03 00 00       	mov    ecx,0x3e8
  4111d4:	89 4c 24 00          	mov    DWORD PTR [esp+0x0],ecx
  4111d8:	a3 f8 c9 5f 00       	mov    ds:0x5fc9f8,eax
  4111dd:	c7 44 24 04 00 00 00 	mov    DWORD PTR [esp+0x4],0x0
  4111e4:	00 
  4111e5:	df 6c 24 00          	fild   QWORD PTR [esp+0x0]
  4111e9:	f6 05 f5 c9 5f 00 01 	test   BYTE PTR ds:0x5fc9f5,0x1
  4111f0:	dc 0d 28 f0 58 00    	fmul   QWORD PTR ds:0x58f028
  4111f6:	d9 1d fc c9 5f 00    	fstp   DWORD PTR ds:0x5fc9fc
  4111fc:	75 05                	jne    0x411203
  4111fe:	e8 2d d3 06 00       	call   0x47e530
  411203:	e8 28 10 00 00       	call   0x412230
  411208:	e8 c3 72 01 00       	call   0x4284d0
  41120d:	e8 fe 41 04 00       	call   0x455410
  411212:	e8 59 85 07 00       	call   0x489770
  411217:	e8 e4 96 07 00       	call   0x48a900
  41121c:	83 c4 08             	add    esp,0x8
  41121f:	c3                   	ret
  411220:	56                   	push   esi
  411221:	57                   	push   edi
  411222:	33 ff                	xor    edi,edi
  411224:	e8 c7 d2 06 00       	call   0x47e4f0
  411229:	8b 35 bc 13 5f 00    	mov    esi,DWORD PTR ds:0x5f13bc
  41122f:	39 3d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,edi
  411235:	7e 18                	jle    0x41124f
  411237:	8b 46 08             	mov    eax,DWORD PTR [esi+0x8]
  41123a:	47                   	inc    edi
  41123b:	50                   	push   eax
  41123c:	83 c6 34             	add    esi,0x34
  41123f:	e8 0c 54 11 00       	call   0x526650
  411244:	83 c4 04             	add    esp,0x4
  411247:	39 3d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,edi
  41124d:	7f e8                	jg     0x411237
  41124f:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  411254:	33 ff                	xor    edi,edi
  411256:	50                   	push   eax
  411257:	e8 f4 53 11 00       	call   0x526650
  41125c:	83 c4 04             	add    esp,0x4
  41125f:	8b 35 c4 13 5f 00    	mov    esi,DWORD PTR ds:0x5f13c4
  411265:	39 3d c0 13 5f 00    	cmp    DWORD PTR ds:0x5f13c0,edi
  41126b:	7e 24                	jle    0x411291
  41126d:	8b 46 08             	mov    eax,DWORD PTR [esi+0x8]
  411270:	47                   	inc    edi
  411271:	50                   	push   eax
  411272:	83 c6 18             	add    esi,0x18
  411275:	e8 d6 53 11 00       	call   0x526650
  41127a:	83 c4 04             	add    esp,0x4
  41127d:	8b 46 fc             	mov    eax,DWORD PTR [esi-0x4]
  411280:	50                   	push   eax
  411281:	e8 ca 53 11 00       	call   0x526650
  411286:	83 c4 04             	add    esp,0x4
  411289:	39 3d c0 13 5f 00    	cmp    DWORD PTR ds:0x5f13c0,edi
  41128f:	7f dc                	jg     0x41126d
  411291:	a1 c4 13 5f 00       	mov    eax,ds:0x5f13c4
  411296:	50                   	push   eax
  411297:	e8 b4 53 11 00       	call   0x526650
  41129c:	83 c4 04             	add    esp,0x4
  41129f:	68 cc 13 5f 00       	push   0x5f13cc
  4112a4:	e8 47 62 11 00       	call   0x5274f0
  4112a9:	83 c4 04             	add    esp,0x4
  4112ac:	e8 6f 40 04 00       	call   0x455320
  4112b1:	5f                   	pop    edi
  4112b2:	5e                   	pop    esi
  4112b3:	c3                   	ret
  4112b4:	cc                   	int3
  4112b5:	cc                   	int3
  4112b6:	cc                   	int3
  4112b7:	cc                   	int3
  4112b8:	cc                   	int3
  4112b9:	cc                   	int3
  4112ba:	cc                   	int3
  4112bb:	cc                   	int3
  4112bc:	cc                   	int3
  4112bd:	cc                   	int3
  4112be:	cc                   	int3
  4112bf:	cc                   	int3
