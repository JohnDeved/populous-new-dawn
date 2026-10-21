
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

005162e0 <.text+0x1152e0>:
  5162e0:	83 ec 0c             	sub    esp,0xc
  5162e3:	83 3d 78 a0 5d 00 00 	cmp    DWORD PTR ds:0x5da078,0x0
  5162ea:	74 18                	je     0x516304
  5162ec:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  5162f0:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  5162f4:	8b 54 24 10          	mov    edx,DWORD PTR [esp+0x10]
  5162f8:	50                   	push   eax
  5162f9:	51                   	push   ecx
  5162fa:	52                   	push   edx
  5162fb:	e8 e0 44 01 00       	call   0x52a7e0
  516300:	83 c4 18             	add    esp,0x18
  516303:	c3                   	ret
  516304:	8d 44 24 08          	lea    eax,[esp+0x8]
  516308:	8d 4c 24 04          	lea    ecx,[esp+0x4]
  51630c:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  516310:	50                   	push   eax
  516311:	51                   	push   ecx
  516312:	52                   	push   edx
  516313:	e8 58 fe ff ff       	call   0x516170
  516318:	83 c4 0c             	add    esp,0xc
  51631b:	83 7c 24 04 00       	cmp    DWORD PTR [esp+0x4],0x0
  516320:	74 41                	je     0x516363
  516322:	8b 0d 74 a0 5d 00    	mov    ecx,DWORD PTR ds:0x5da074
  516328:	a1 e0 a0 5d 00       	mov    eax,ds:0x5da0e0
  51632d:	f6 c1 08             	test   cl,0x8
  516330:	75 05                	jne    0x516337
  516332:	b8 ff ff ff 00       	mov    eax,0xffffff
  516337:	db 44 24 14          	fild   DWORD PTR [esp+0x14]
  51633b:	51                   	push   ecx
  51633c:	50                   	push   eax
  51633d:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  516341:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  516345:	50                   	push   eax
  516346:	51                   	push   ecx
  516347:	83 ec 04             	sub    esp,0x4
  51634a:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  516350:	83 ec 04             	sub    esp,0x4
  516353:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  516357:	db 44 24 28          	fild   DWORD PTR [esp+0x28]
  51635b:	d9 1c 24             	fstp   DWORD PTR [esp]
  51635e:	e8 ed 78 f6 ff       	call   0x47dc50
  516363:	83 c4 0c             	add    esp,0xc
  516366:	c3                   	ret
  516367:	cc                   	int3
  516368:	cc                   	int3
  516369:	cc                   	int3
  51636a:	cc                   	int3
  51636b:	cc                   	int3
  51636c:	cc                   	int3
  51636d:	cc                   	int3
  51636e:	cc                   	int3
  51636f:	cc                   	int3
